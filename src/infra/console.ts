console.color =
  (color: string, backgroundColor?: string) =>
  (...args: any[]) => {
    console.log(
      `%c${args.join(" ")}`,
      `color: ${color}; backgroundColor: ${backgroundColor ?? "none"}`,
    );
  };

export {};
