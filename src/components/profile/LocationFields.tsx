import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { KENYA_COUNTIES } from '../../../convex/lib/kenya';

export const OUTSIDE_KENYA = '__outside__';

const COUNTY_OPTIONS = [
  ...KENYA_COUNTIES.map((c) => ({ value: c, label: c })),
  { value: OUTSIDE_KENYA, label: 'Outside Kenya' },
];

export interface LocationValue {
  county: string;
  country: string;
}

/** Convert stored profile/venture fields to the picker value. */
export function toLocationValue(county?: string | null, country?: string | null): LocationValue {
  if (county) return { county, country: 'Kenya' };
  if (country && country.trim().toLowerCase() !== 'kenya') return { county: OUTSIDE_KENYA, country };
  return { county: '', country: '' };
}

/** Convert picker value to what the backend stores. Empty strings clear the field. */
export function fromLocationValue(v: LocationValue): { county: string; country: string } {
  if (v.county === OUTSIDE_KENYA) return { county: '', country: v.country.trim() };
  if (v.county) return { county: v.county, country: 'Kenya' };
  return { county: '', country: '' };
}

/**
 * Optional, encouraged location: a Kenyan county, or "Outside Kenya" plus a country.
 * It powers the county map on the admin console and helps employers find local talent.
 */
export function LocationFields({
  value,
  onChange,
  label = 'Where are you based?',
  hint = 'Optional, but it helps employers and the Donjo team understand where talent and ventures are.',
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-4">
      <Field label={label} optional hint={hint}>
        <Select
          placeholder="Select your county"
          searchPlaceholder="Search counties"
          value={value.county}
          onValueChange={(county) => onChange({ county, country: county === OUTSIDE_KENYA ? value.country : '' })}
          options={COUNTY_OPTIONS}
          clearable
        />
      </Field>
      {value.county === OUTSIDE_KENYA && (
        <Field label="Country" required>
          <Input value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} maxLength={80} autoComplete="country-name" placeholder="e.g. Uganda" />
        </Field>
      )}
    </div>
  );
}
