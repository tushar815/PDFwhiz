import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import React, { useContext, useRef } from "react";
import { ChatContext } from "./ChatContext";

interface ChatInputProps {
  isDisabled?: boolean;
}
const ChatInput = ({ isDisabled }: ChatInputProps) => {
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext);

    const textRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="absolute bottom-0 left-0 w-full">
      <div className="mx-2 flex flex-row gap-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
        <div className="relative flex h-full flex-1 items-stretch md:flex-col">
          <div className="relative flex flex-col w-full flex-grow p-4">
            <div className="relative">
              <Textarea
                className="resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scsrollbar-w-2 scrolling-touch"
                rows={1}
                maxRows={4}
                ref={textRef}
                autoFocus
                onKeyDown={(e)=> {
                  if(e.key === 'Enter' &&  !e.shiftKey){
                    e.preventDefault()
                    addMessage()
                    textRef.current?.focus()
                  }
                }}
                onChange={handleInputChange}
                value={message}
                placeholder="Enter your Question...."
              />
              <Button
                className="absolute bottom-1.5 right-[8px]"
                aria-label="send message"
                disabled={isLoading || isDisabled}
                type="submit"
                onClick={()=> {
                  addMessage()
                  textRef.current?.focus()
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
