import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

export function Message({ className, from, ...props }) {
  return (
    <div
      className={cn(
        "group flex w-full items-end justify-end gap-2 py-4",
        from === "user"
          ? "is-user"
          : "is-assistant flex-row-reverse justify-end",
        className
      )}
      {...props}
    />
  );
}

const messageContentVariants = cva(
  "is-user:dark flex flex-col gap-2 overflow-hidden rounded-lg text-sm",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[80%] px-4 py-3",
          "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
          "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
        ],
        flat: [
          "group-[.is-user]:max-w-[80%] group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
          "group-[.is-assistant]:text-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
);

export function MessageContent({ children, className, variant, ...props }) {
  return (
    <div className={cn(messageContentVariants({ variant, className }))} {...props}>
      {children}
    </div>
  );
}

export function MessageAvatar({ src, name, className, ...props }) {
  return (
    <Avatar className={cn("size-10", className)} {...props}>
      <AvatarImage alt="" src={src} />
      <AvatarFallback>{name?.slice(0, 2) || "🤖"}</AvatarFallback>
    </Avatar>
  )
}
