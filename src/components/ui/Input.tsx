import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { createInput } from '@gluestack-ui/core/input/creator';
import { createFormControl } from '@gluestack-ui/core/form-control/creator';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

// Filtered wrappers: strip GlueStack-internal props before forwarding to native elements
const InputRoot = React.forwardRef<View, any>(({ states, dataSet, ...rest }, ref) => (
  <View ref={ref} dataSet={dataSet} {...rest} />
));

const InputNativeField = React.forwardRef<TextInput, any>(
  ({ states, dataSet, tabIndex, readOnly, ...rest }, ref) => (
    <TextInput ref={ref} editable={readOnly === true ? false : rest.editable} {...rest} />
  )
);

const FormControlRoot = React.forwardRef<View, any>(({ states, dataSet, ...rest }, ref) => (
  <View ref={ref} {...rest} />
));

const Noop = React.forwardRef<View, any>(({ states, dataSet, ...rest }, ref) => (
  <View ref={ref} {...rest} />
));

const NoopText = React.forwardRef<Text, any>(({ states, dataSet, ...rest }, ref) => (
  <Text ref={ref} {...rest} />
));

// GlueStack headless creators
const UIInput = createInput({
  Root: InputRoot,
  Icon: Noop,
  Slot: Noop,
  Input: InputNativeField,
});

const UIFormControl = createFormControl({
  Root: FormControlRoot,
  Error: Noop,
  ErrorText: NoopText,
  ErrorIcon: Noop,
  Label: Noop,
  LabelText: NoopText,
  LabelAstrick: NoopText,
  Helper: Noop,
  HelperText: NoopText,
});

// Styles
const inputContainerStyle = tva({
  base: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex-row items-center overflow-hidden data-[focus=true]:border-primary-500',
  variants: {
    isInvalid: {
      true: 'border-red-500 data-[focus=true]:border-red-500',
    },
  },
});

const inputFieldStyle = tva({
  base: 'flex-1 text-gray-900 dark:text-gray-100 text-base px-4 py-3',
});

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const isInvalid = !!error;
  return (
    <UIFormControl isInvalid={isInvalid} className="mb-4">
      {label ? (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </Text>
      ) : null}
      <UIInput
        isInvalid={isInvalid}
        className={inputContainerStyle({ isInvalid, class: className })}
      >
        <UIInput.Input
          className={inputFieldStyle({})}
          placeholderTextColor="#6b7280"
          {...props}
        />
      </UIInput>
      {error ? (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      ) : null}
    </UIFormControl>
  );
}
