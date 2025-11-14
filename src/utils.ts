import { ethers } from "ethers";

export function extractCommonPrefix(inputData: string): string {
  const data = inputData.startsWith("0x") ? inputData.slice(2) : inputData;
  if (data.length <= 8) return inputData;
  return `0x${data.slice(0, -64)}`;
}

export function processInputData(
  originalInputData: string,
  address: string,
): string {
  const commonPrefix = extractCommonPrefix(originalInputData);
  const formattedAddress = ethers.isAddress(address) ? address : `0x${address}`;
  const paddedAddress = formattedAddress.slice(2).padStart(64, "0");
  return `${commonPrefix}${paddedAddress}`;
}
