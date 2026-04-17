import CurrencyInput from "react-currency-input-field";

interface RupiahInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const RupiahInput: React.FC<RupiahInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  className = "",
  autoFocus = false,
  disabled = false,
  onKeyDown,
}) => {
  return (
    <CurrencyInput
      className={className}
      placeholder={placeholder}
      defaultValue={value || undefined}
      onValueChange={(val) => {
        onChange(val ? parseInt(val, 10) : 0);
      }}
      prefix="Rp "
      groupSeparator="."
      decimalSeparator=","
      decimalsLimit={0}
      allowNegativeValue={false}
      autoFocus={autoFocus}
      disabled={disabled}
      onKeyDown={onKeyDown}
    />
  );
};
