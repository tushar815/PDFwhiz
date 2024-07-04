"use client"

import {useState} from "react";
import {Dialog, DialogContent, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {set} from "zod";

const UploadButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    return(
        <Dialog open={isOpen} onOpenChange={(v)=> {
            if(!v){
                setIsOpen(v);
            }
        }}>
            <DialogTrigger onClick={() => setIsOpen(true)} asChild>
                <Button>Upload PDF</Button>
            </DialogTrigger>
            <DialogContent>example</DialogContent>
        </Dialog>

    )
}

export default UploadButton;