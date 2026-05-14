import React from "react";
import { toBanglaNumber } from "@/utils/toBanglaNumber";

interface BanglaNumberProps {
  value: number | string;
}

const BanglaNumber = ({ value }: BanglaNumberProps) => {
  return <span className="">{toBanglaNumber(value)}</span>;
};

export default BanglaNumber;
