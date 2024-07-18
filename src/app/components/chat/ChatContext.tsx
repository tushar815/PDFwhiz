import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { createContext, ReactNode, useState } from "react";
import { string } from "zod";


type StreamResponse = {
    addMessage: () =>  void,
    message: string,
    handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
    isLoading: boolean, 
}
export const ChatContext = createContext<StreamResponse>({
    addMessage: () =>  {},
    message: '',
    handleInputChange: () => {},
    isLoading: false,
})


interface Props  {
    fileId: string,
    children: ReactNode
}
export const ChatContextProvider = ({fileId, children}: Props) => {


    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const {toast} = useToast()
    const {mutate: sendMessage} = useMutation({
        mutationFn: async ({message} : {message: string}) => {
            const response = await fetch('/api/message', {
                method: 'POST',
                body: JSON.stringify({fileId,
                    message
                })
            }) 
            if(!response.ok){
                 throw new Error('Failed to send a message')
            }

            return response.body
        }
    })

    const addMessage = () => {
      return  sendMessage({message})
    }

 
    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(event.target.value)
    }
    return <ChatContext.Provider value={{
        addMessage,
        message,
        handleInputChange,
        isLoading
    }} >{children}</ChatContext.Provider>
}