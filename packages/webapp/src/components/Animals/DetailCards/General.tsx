/*
 *  Copyright 2024 LiteFarm.org
 *  This file is part of LiteFarm.
 *
 *  LiteFarm is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  LiteFarm is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Input, { getInputErrors } from '../../Form/Input';
import RadioGroup from '../../Form/RadioGroup';
import ReactSelect from '../../Form/ReactSelect';
import InputBaseLabel from '../../Form/InputBase/InputBaseLabel';
import NumberInput from '../../Form/NumberInput';
import SexDetails from '../../Form/SexDetails';
import { type Details as SexDetailsType } from '../../Form/SexDetails/SexDetailsPopover';
import { AnimalOrBatchKeys } from '../../../containers/Animals/types';
import {
  DetailsFields,
  type Option,
  type CommonDetailsProps,
} from '../../../containers/Animals/AddAnimals/types';
import styles from './styles.module.scss';
import {
  hookFormMinValidation,
  hookFormMaxCharsValidation,
} from '../../Form/hookformValidationUtils';

export type GeneralDetailsProps = CommonDetailsProps & {
  sexOptions: Option[DetailsFields.SEX][];
  useOptions: Option[DetailsFields.USE][];
  animalOrBatch: AnimalOrBatchKeys;
  sexDetailsOptions?: SexDetailsType;
};

const GeneralDetails = ({
  t,
  sexOptions,
  useOptions,
  animalOrBatch,
  sexDetailsOptions,
  namePrefix = '',
}: GeneralDetailsProps) => {
  const {
    control,
    register,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext();

  const watchBatchCount = watch(`${namePrefix}${DetailsFields.COUNT}`) || 0;
  const watchedUse = watch(`${namePrefix}${DetailsFields.USE}`) as Option[DetailsFields.USE][];

  const isOtherUseSelected = !watchedUse ? false : watchedUse.some((use) => use.key === 'OTHER');

  const sexInputs = useMemo(() => {
    if (animalOrBatch === AnimalOrBatchKeys.ANIMAL) {
      return (
        <>
          <div>
            <InputBaseLabel optional label={t('ANIMAL.ANIMAL_SEXES')} />
            {/* @ts-ignore */}
            <RadioGroup
              name={`${namePrefix}${DetailsFields.SEX}`}
              radios={sexOptions}
              hookFormControl={control}
              row
            />
          </div>
        </>
      );
    }

    return (
      <div className={styles.countAndSexDetailsWrapper}>
        <NumberInput
          name={`${namePrefix}${DetailsFields.COUNT}`}
          control={control}
          label={t('common:COUNT')}
          className={styles.countInput}
          allowDecimal={false}
          showStepper
          defaultValue={getValues(`${namePrefix}${DetailsFields.COUNT}`)}
          rules={{
            required: {
              value: true,
              message: t('common:REQUIRED'),
            },
            min: hookFormMinValidation(1),
          }}
          onChange={() => trigger(`${namePrefix}${DetailsFields.COUNT}`)}
        />
        <Controller
          name={`${namePrefix}${DetailsFields.SEX_DETAILS}`}
          control={control}
          rules={{
            validate: (details: SexDetailsType) => {
              if (!details) return true;
              const total = details.reduce((prevCount, { count }) => prevCount + count, 0);
              return total <= watchBatchCount || 'Invalid sexDetails for count';
            },
          }}
          render={({ field: { onChange, value } }) => {
            return (
              <SexDetails
                initialDetails={value || sexDetailsOptions}
                maxCount={watchBatchCount}
                onConfirm={(details) => onChange(details)}
              />
            );
          }}
        />
      </div>
    );
  }, [animalOrBatch, t, sexOptions, control, watchBatchCount]);

  return (
    <div className={styles.sectionWrapper}>
      {animalOrBatch === AnimalOrBatchKeys.BATCH && (
        <>
          {/* @ts-ignore */}
          <Input
            type="text"
            label={t('ANIMAL.ATTRIBUTE.BATCH_NAME')}
            hookFormRegister={register(`${namePrefix}${DetailsFields.BATCH_NAME}`, {
              maxLength: hookFormMaxCharsValidation(255),
            })}
            trigger={trigger}
            optional
            placeholder={t('ADD_ANIMAL.PLACEHOLDER.BATCH_NAME')}
            errors={getInputErrors(errors, `${namePrefix}${DetailsFields.BATCH_NAME}`)}
          />
        </>
      )}
      <Controller
        control={control}
        name={`${namePrefix}${DetailsFields.TYPE}`}
        render={({ field: { onChange, value } }) => (
          <ReactSelect
            label={t('ANIMAL.ANIMAL_TYPE')}
            value={value}
            onChange={onChange}
            isDisabled
          />
        )}
      />
      <Controller
        control={control}
        name={`${namePrefix}${DetailsFields.BREED}`}
        render={({ field: { onChange, value } }) => (
          <ReactSelect
            label={t('ANIMAL.ANIMAL_BREED')}
            optional
            value={value}
            onChange={onChange}
            isDisabled
          />
        )}
      />
      {sexInputs}
      <Controller
        control={control}
        name={`${namePrefix}${DetailsFields.USE}`}
        render={({ field: { onChange, value } }) => (
          <ReactSelect
            label={t('common:USE')}
            optional
            isMulti
            value={value}
            onChange={onChange}
            options={useOptions}
            style={{ paddingBottom: '12px' }} // accomodate "Clear all" button space
          />
        )}
      />
      {isOtherUseSelected && (
        <>
          {/* @ts-ignore */}
          <Input
            type="text"
            label={t('ANIMAL.ATTRIBUTE.OTHER_USE')}
            hookFormRegister={register(`${namePrefix}${DetailsFields.OTHER_USE}`, {
              maxLength: hookFormMaxCharsValidation(255),
            })}
            optional
            placeholder={t('ADD_ANIMAL.PLACEHOLDER.OTHER_USE')}
            errors={getInputErrors(errors, `${namePrefix}${DetailsFields.OTHER_USE}`)}
          />
        </>
      )}
    </div>
  );
};

export default GeneralDetails;
