"use client";

import { AddressSuggestions } from "react-dadata";

type AddressInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function AddressInput({ value, onChange }: AddressInputProps) {
  return (
    <AddressSuggestions
      token='6417c7f46b24086811637be6ef3ca941561519ed'
      onChange={(data) => onChange(data?.value ?? "")}
      inputProps={{
        placeholder: "Адрес доставки",
      }}
    />
  );
}
