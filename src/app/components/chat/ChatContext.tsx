import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { useMutation } from "@tanstack/react-query";
import { read } from "fs";
import _ from "lodash";
import { createContext, ReactNode, useRef, useState } from "react";
import { string } from "zod";

type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};
export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

interface Props {
  fileId: string;
  children: ReactNode;
}
export const ChatContextProvider = ({ fileId, children }: Props) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useContext();
  const { toast } = useToast();
  const backupMessage = useRef("");
  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({ fileId, message }),
      });
      if (!response.ok) {
        throw new Error("Failed to send a message");
      }
      return response.body;
    },
    onMutate: async ({ message }) => {
      backupMessage.current = message;
      setMessage("");
      await utils.getFileMessages.cancel();
      const prevMessages = utils.getFileMessages.getInfiniteData();
      utils.getFileMessages.setInfiniteData(
        { fileId, limit: INFINITE_QUERY_LIMIT },
        (old) => {
          if (!old) {
            return {
              pages: [],
              pageParams: [],
            };
          }
          let newPages = [...old.pages];
          let latestPages = newPages[0]!;
          latestPages.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPages.messages,
          ];

          newPages[0] = latestPages;

          return {
            ...old,
            pages: newPages,
          };
        }
      ),
        setIsLoading(true);

      return {
        prevMessages:
          prevMessages?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    onSuccess: async (stream) => {
      setIsLoading(false);
      if (!stream) {
        return toast({
          title: "There was a problem sending this message",
          description: "please refresh the page",
          variant: "destructive",
        });
      }
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      let accResponse = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        accResponse += chunk;
        utils.getFileMessages.setInfiniteData(
          { fileId, limit: INFINITE_QUERY_LIMIT },
          (old) => {
            if (!old)
              return {
                pages: [],
                pageParams: [],
              };

            let isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === "ai-response")
            );

            let updatedpages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessages;
                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: "ai-response",
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ];
                } else {
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === "ai-response") {
                      return {
                        ...message,
                        text: accResponse,
                      };
                    }
                    return message;
                  });
                }

                return {
                  ...page,
                  messages: updatedMessages,
                };
              }

              return page;
            });

            return { ...old, pages: updatedpages };
          }
        );
      }
    },
    onError: (_, __, context) => {
      setMessage(backupMessage.current);
      utils.getFileMessages.setData(
        {
          fileId,
        },
        { messages: context?.prevMessages ?? [] }
      );
    },
    onSettled: async () => {
      setIsLoading(false);
      await utils.getFileMessages.invalidate({ fileId });
    },
  });

  const addMessage = () => {
    return sendMessage({ message });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };
  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
