import { Field } from '../../components/ui/Field';
import type { AdminSection } from '../../types/adminContent';

/** Wat de velden van een leden-, projecten- of vooruitbliksectie meekrijgen. */
export interface CollectionFieldsProps<T extends AdminSection['type']> {
  section: Extract<AdminSection, { type: T }>;
  fieldId: string;
  csrfToken: string;
  limits: Record<string, number>;
  choices: Record<string, string[]>;
  onChange: (section: AdminSection) => void;
}

interface SectionIntroFieldsProps {
  heading: string;
  intro: string;
  fieldId: string;
  limits: Record<string, number>;
  onChange: (heading: string, intro: string) => void;
}

/** De kop en inleiding boven de leden of de projecten. */
export function SectionIntroFields({
  heading,
  intro,
  fieldId,
  limits,
  onChange,
}: SectionIntroFieldsProps) {
  return (
    <>
      <Field
        id={`${fieldId}-heading`}
        label="Kop"
        maxLength={limits.heading}
        value={heading}
        onChange={(value) => {
          onChange(value, intro);
        }}
      />
      <Field
        id={`${fieldId}-intro`}
        label="Inleiding (mag leeg blijven)"
        maxLength={limits.intro}
        value={intro}
        onChange={(value) => {
          onChange(heading, value);
        }}
        multiline
      />
    </>
  );
}
