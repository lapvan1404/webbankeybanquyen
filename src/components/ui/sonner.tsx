import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const defaultToastOptions = {
    duration: 1000,
    classNames: {
      toast:
        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
      description: "group-[.toast]:text-muted-foreground",
      actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
      cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
    },
  };
  const position = ((
    props as unknown as { position?: React.ComponentProps<typeof Sonner>["position"] }
  ).position || "bottom-right") as React.ComponentProps<typeof Sonner>["position"];
  const toastOptions = {
    ...defaultToastOptions,
    ...((props as unknown as { toastOptions?: Record<string, unknown> }).toastOptions || {}),
  };

  return (
    <Sonner className="toaster group" position={position} toastOptions={toastOptions} {...props} />
  );
};

export { Toaster };
