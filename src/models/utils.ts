
export type InferAttributes<
  M,
  Options
  > = {
  [Key in keyof M]: M[Key]
};
