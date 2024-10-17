export type OverridableStringUnion<T extends string> = GenerateStringUnion<DistributiveOmit<Record<T, true>>>

type GenerateStringUnion<T> = Extract<
  {
    [Key in keyof T]: true extends T[Key] ? Key : never
  }[keyof T],
  string
>

type DistributiveOmit<T> = T extends T ? T : never
