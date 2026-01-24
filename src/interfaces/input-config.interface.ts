export type InputType = 'input' | 'select' | 'datepicker' | "numeric" | "multiselect" | "password" | "textarea";
export type InputNumericMode = 'currency' | 'decimal';


interface InputOption {
    label: string;
    value: string | boolean | number;
}


export interface InputConfig {
    label: string;
    inputId: string;
    inputType: InputType;
    options?: InputOption[];
    inputNumericMode?: InputNumericMode;
    hourFormat?: boolean;
    timeOnly?: boolean;
    icon?:string;
    required?:boolean;
    isNotNeccesary?:boolean;
    placeholder?: string;
}
