type TypeMapping = {
  boolean: boolean;
  string: string;
  color: string;
};

type TypeMappingWithNumber = {
  number: number;
} & TypeMapping;

type OptionDefinition = {
  [key: string]: {
    type: keyof TypeMapping;
    default: TypeMapping[keyof TypeMapping];
    name: string;
  };
};

/* 
type OptionDef<T extends keyof TypeMapping> = {
  type: T;
  default: TypeMapping[T];
  name: string;
};
*/

type OptionDefWithoutNumber<T extends keyof Omit<TypeMapping, "number">> = {
  type: T;
  default: TypeMapping[T];
  name: string;
};

type OptionNumberDef = {
  type: "number";
  default: number;
  name: string;
  min: number;
  max: number;
};

type ChartOptions<
  T extends Record<string, OptionDef<keyof TypeMappingWithNumber>>
> = {
  [K in keyof T]: TypeMappingWithNumber[T[K]["type"]];
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
