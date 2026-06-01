declare module "convert-units" {
  interface UnitDescription {
    abbr: string;
    measure: string;
    system: string;
    singular: string;
    plural: string;
  }
  interface ConvertChain {
    from(unit: string): {
      to(unit: string): number;
      toBest(): { val: number; unit: string };
      possibilities(): string[];
    };
    possibilities(measure?: string): string[];
    describe(unit: string): UnitDescription;
    measures(): string[];
    list(measure?: string): UnitDescription[];
  }
  interface Convert {
    (value: number): ConvertChain;
  }
  const convert: Convert;
  export default convert;
}
