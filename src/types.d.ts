type TypeMapping = {
  boolean: boolean;
  color: string;
  number: number;
};

type OptionDefinition = {
  [key: string]: {
    type: keyof TypeMapping;
    default: TypeMapping[keyof TypeMapping];
    name: string;
  };
};

type OptionDef<T extends keyof TypeMapping> = {
  type: T;
  default: TypeMapping[T];
  name: string;
};

type ChartOptions<T extends Record<string, OptionDef<keyof TypeMapping>>> = {
  [K in keyof T]: TypeMapping[T[K]["type"]];
};

type ChartAlignment = "left" | "right" | "center";

type TeacherOptions = {
  showOptions: boolean;
  showData: boolean;
  showLockedOptions: boolean;
  changeData: boolean;
  changeOptions: boolean;
  addRemoveData: boolean;
};
