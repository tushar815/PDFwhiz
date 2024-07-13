"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormState } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { useForm } from "react-hook-form";
import {zodResolver} from '@hookform/resolvers/zod'

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { useResizeDetector } from "react-resize-detector";
import { z } from "zod";
import page from "../dashboard/[fileid]/page";
import { cn } from "@/lib/utils";

//pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
interface PdfRendererProps {
  url: string;
}

const PdfRenderer = ({ url }: PdfRendererProps) => {
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number>();
  const [currPage, setCurrPage] = useState(1);
  const { width, ref } = useResizeDetector();


  const CustomPageValidator = z.object({
    page: z.string().refine((n) => Number(n) > 0 && Number(n) <= numPages!),
  });

  type TCustomPageValidator  = z.infer<typeof CustomPageValidator>

  const handlePageSubmit = ({
    page, 
  }: TCustomPageValidator) => {
    setCurrPage(Number(page))
    setValue("page", String(page))
  }
  
  const {register , handleSubmit, formState: {errors}, setValue} = useForm<TCustomPageValidator>({
    defaultValues: {
      page: '1'
    }, resolver: zodResolver(CustomPageValidator)
  });

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-r-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            onClick={() => {
              setCurrPage((p) => (p + 1 >= numPages! ? numPages! : p + 1));
            }}
            variant="ghost"
            aria-label="previous page"
            disabled={numPages === undefined || currPage === numPages}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input  
            {...register("page")}
            value={currPage}
            onKeyDown={(e) => {
             if(e.key === 'Enter'){
              handleSubmit(handlePageSubmit)()
             }
            }}
            className={cn("w-12 h-8", errors.page && "outline-red-500")}/>
            <p className="Text-zinc-700 text-sm space-x-1">
              <span>/</span>
              <span>{numPages ?? "x"} </span>
            </p>
          </div>

          <Button
            variant="ghost"
            aria-label="next page"
            disabled={currPage <= 1}
            onClick={() => {
              setCurrPage((p) => (p - 1 > 1 ? p - 1 : 1));
            }}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full max-h-screen">
        <div ref={ref}>
          <Document
            loading={
              <div className="justify-center flex">
                <Loader2 className="my-24 h-6 w-6 animate-spin" />{" "}
              </div>
            }
            onLoadError={() => {
              toast({
                title: "Error loading pdf",
                description: "Please try again later.",
                variant: "destructive",
              });
            }}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
            }}
            file={url}
            className="max-h-full"
          >
            <Page width={width ? width : 1} pageNumber={currPage} />
          </Document>
        </div>
      </div>
    </div>
  );
};
export default PdfRenderer;
