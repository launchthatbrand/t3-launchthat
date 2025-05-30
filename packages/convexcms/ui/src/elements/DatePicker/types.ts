import type {
  DayPickerProps,
  SharedProps,
  TimePickerProps,
} from "@convexcms/core";

export type Props = {
  id?: string;
  onChange?: (val: Date) => void;
  placeholder?: string;
  readOnly?: boolean;
  value?: Date | string;
} & DayPickerProps &
  SharedProps &
  TimePickerProps;
