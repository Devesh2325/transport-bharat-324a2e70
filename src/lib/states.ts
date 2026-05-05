// Indian states + UT list with GST state codes
export const IN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu & Kashmir" }, { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" }, { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" }, { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" }, { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" }, { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" }, { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" }, { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" }, { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" }, { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" }, { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" }, { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" }, { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" }, { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" }, { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" }, { code: "34", name: "Puducherry" },
  { code: "36", name: "Telangana" }, { code: "37", name: "Andhra Pradesh" },
];

export interface GstSplit { cgst: number; sgst: number; igst: number; total: number; interstate: boolean }

export function calcGst(base: number, ratePct: number, consignorState: string | null, consigneeState: string | null): GstSplit {
  const r = (Number(ratePct) || 0) / 100;
  const tax = (Number(base) || 0) * r;
  const interstate = !!consignorState && !!consigneeState && consignorState !== consigneeState;
  if (interstate) return { cgst: 0, sgst: 0, igst: tax, total: base + tax, interstate: true };
  return { cgst: tax / 2, sgst: tax / 2, igst: 0, total: base + tax, interstate: false };
}
