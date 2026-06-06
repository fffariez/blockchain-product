import { cn } from "@/lib/utils";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full p-2 border rounded-md dark:bg-neutral-800 dark:text-white border-gray-300 dark:border-neutral-700",
        props.className
      )}
      {...props}
    />
  );
}
