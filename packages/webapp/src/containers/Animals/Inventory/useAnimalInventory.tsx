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
import { FC, useMemo } from 'react';
import i18n from '../../../locales/i18n';
import {
  useGetAnimalsQuery,
  useGetAnimalBatchesQuery,
  useGetAnimalGroupsQuery,
  useGetCustomAnimalBreedsQuery,
  useGetCustomAnimalTypesQuery,
  useGetDefaultAnimalBreedsQuery,
  useGetDefaultAnimalTypesQuery,
  useGetAnimalSexesQuery,
} from '../../../store/api/apiSlice';
import useQueries from '../../../hooks/api/useQueries';
import {
  Animal,
  AnimalBatch,
  AnimalGroup,
  CustomAnimalBreed,
  CustomAnimalType,
  DefaultAnimalBreed,
  DefaultAnimalType,
} from '../../../store/api/types';
import { getComparator, orderEnum } from '../../../util/sort';
import { ReactComponent as CattleIcon } from '../../../assets/images/animals/cattle-icon.svg';
import { ReactComponent as ChickenIcon } from '../../../assets/images/animals/chicken-icon.svg';
import { ReactComponent as PigIcon } from '../../../assets/images/animals/pig-icon.svg';
import { ReactComponent as BatchIcon } from '../../../assets/images/animals/batch.svg';
import { AnimalTranslationKey } from '../types';
import { FilterState } from '../../Filter/types';
import { isInactive } from '../../Filter/utils';
import { isInFilter } from '../../Filter/Animals/utils';
import { AnimalOrBatchKeys } from '../../Filter/Animals/types';

export type AnimalInventory = {
  icon: FC;
  identification: string;
  type: string;
  breed: string;
  groups: string[];
  path: string;
  count: number;
  batch: boolean;
};

const { t } = i18n;

const getDefaultAnimalIcon = (
  defaultAnimalTypes: DefaultAnimalType[],
  defaultTypeId: number | null,
) => {
  const key = defaultAnimalTypes.find(({ id }) => id === defaultTypeId)?.key;
  switch (key) {
    case AnimalTranslationKey.CATTLE:
      return CattleIcon;
    case AnimalTranslationKey.CHICKEN_BROILERS:
      return ChickenIcon;
    case AnimalTranslationKey.CHICKEN_LAYERS:
      return ChickenIcon;
    case AnimalTranslationKey.PIGS:
      return PigIcon;
    default:
      return CattleIcon;
  }
};

type hasId = {
  id: number;
  [key: string]: any;
};

const getProperty = (arr: hasId[] | undefined, id: number | null, key: string) => {
  return arr?.find((el) => el.id === id)?.[key] || null;
};

const getAnimalTypeLabel = (key: string) => {
  return t(`TYPE.${key}`, { ns: 'animal' });
};

const getAnimalBreedLabel = (key: string) => {
  return t(`BREED.${key}`, { ns: 'animal' });
};

const chooseIdentification = (animalOrBatch: Animal | AnimalBatch) => {
  if ('identifier' in animalOrBatch && animalOrBatch.identifier) {
    if (animalOrBatch.name && animalOrBatch.identifier) {
      return `${animalOrBatch.name} | ${animalOrBatch.identifier}`;
    } else if (!animalOrBatch.name && animalOrBatch.identifier) {
      return animalOrBatch.identifier;
    }
  }
  if (animalOrBatch.name) {
    return animalOrBatch.name;
  }
  return `${t('ANIMAL.ANIMAL_ID')}${animalOrBatch.internal_identifier}`;
};

const chooseAnimalTypeLabel = (
  animalOrBatch: Animal | AnimalBatch,
  defaultAnimalTypes: DefaultAnimalType[],
  customAnimalTypes: CustomAnimalType[],
) => {
  if (animalOrBatch.default_type_id) {
    return getAnimalTypeLabel(
      getProperty(defaultAnimalTypes, animalOrBatch.default_type_id, 'key'),
    );
  } else if (animalOrBatch.custom_type_id) {
    return getProperty(customAnimalTypes, animalOrBatch.custom_type_id, 'type');
  } else {
    return null;
  }
};

const chooseAnimalBreedLabel = (
  animalOrBatch: Animal | AnimalBatch,
  defaultAnimalBreeds: DefaultAnimalBreed[],
  customAnimalBreeds: CustomAnimalBreed[],
) => {
  if (animalOrBatch.default_breed_id) {
    return getAnimalBreedLabel(
      getProperty(defaultAnimalBreeds, animalOrBatch.default_breed_id, 'key'),
    );
  } else if (animalOrBatch.custom_breed_id) {
    return getProperty(customAnimalBreeds, animalOrBatch.custom_breed_id, 'breed');
  } else {
    return null;
  }
};

const formatAnimalsData = (
  animals: Animal[],
  animalGroups: AnimalGroup[],
  customAnimalBreeds: CustomAnimalBreed[],
  customAnimalTypes: CustomAnimalType[],
  defaultAnimalBreeds: DefaultAnimalBreed[],
  defaultAnimalTypes: DefaultAnimalType[],
  animalsOrBatchesFilter: FilterState,
  typesFilter: FilterState,
  breedsFilter: FilterState,
  sexFilter: FilterState,
  groupsFilter: FilterState,
  locationsFilter: FilterState,
) => {
  return animals
    .filter((animal: Animal) => {
      const animalOrBatchMatches =
        isInactive(animalsOrBatchesFilter) ||
        animalsOrBatchesFilter[AnimalOrBatchKeys.ANIMAL]?.active;

      const typeMatches = isInactive(typesFilter) || isInFilter(animal, typesFilter, 'type');

      const breedMatches = isInactive(breedsFilter) || isInFilter(animal, breedsFilter, 'breed');

      const sexMatches = isInactive(sexFilter) || sexFilter[animal.sex_id]?.active;

      const groupMatches =
        isInactive(groupsFilter) ||
        animal.group_ids.some((groupId) => groupsFilter[groupId]?.active);

      // *** Location is not yet implemented as a property on animal ***
      const locationMatches = isInactive(locationsFilter);
      // const locationMatches =
      //   isInactive(locationsFilter) || locationsFilter[animal.location]?.active;

      return (
        animalOrBatchMatches &&
        typeMatches &&
        breedMatches &&
        sexMatches &&
        groupMatches &&
        locationMatches
      );
    })
    .map((animal: Animal) => {
      return {
        icon: getDefaultAnimalIcon(defaultAnimalTypes, animal.default_type_id),
        identification: chooseIdentification(animal),
        type: chooseAnimalTypeLabel(animal, defaultAnimalTypes, customAnimalTypes),
        breed: chooseAnimalBreedLabel(animal, defaultAnimalBreeds, customAnimalBreeds),
        groups: animal.group_ids.map((id: number) => getProperty(animalGroups, id, 'name')),
        path: `/animal/${animal.internal_identifier}`,
        count: 1,
        batch: false,
      };
    });
};

const formatAnimalBatchesData = (
  animalBatches: AnimalBatch[],
  animalGroups: AnimalGroup[],
  customAnimalBreeds: CustomAnimalBreed[],
  customAnimalTypes: CustomAnimalType[],
  defaultAnimalBreeds: DefaultAnimalBreed[],
  defaultAnimalTypes: DefaultAnimalType[],
  animalsOrBatchesFilter: FilterState,
  typesFilter: FilterState,
  breedsFilter: FilterState,
  sexFilter: FilterState,
  groupsFilter: FilterState,
  locationsFilter: FilterState,
) => {
  return animalBatches
    .filter((batch: AnimalBatch) => {
      const animalOrBatchMatches =
        isInactive(animalsOrBatchesFilter) ||
        animalsOrBatchesFilter[AnimalOrBatchKeys.BATCH]?.active;

      const typeMatches = isInactive(typesFilter) || isInFilter(batch, typesFilter, 'type');

      const breedMatches = isInactive(breedsFilter) || isInFilter(batch, breedsFilter, 'breed');

      // TODO: look at sex detail shape
      // const sexMatches = isInactive(sexFilter) || sexFilter[batch.sex_id]?.active;
      const sexMatches = true;

      const groupMatches =
        isInactive(groupsFilter) ||
        batch.group_ids.some((groupId) => groupsFilter[groupId]?.active);

      // *** Location is not yet implemented as a property on animal batch ***
      const locationMatches = isInactive(locationsFilter);
      // const locationMatches =
      //   isInactive(locationsFilter) || locationsFilter[batch.location]?.active;

      return (
        animalOrBatchMatches &&
        typeMatches &&
        breedMatches &&
        sexMatches &&
        groupMatches &&
        locationMatches
      );
    })
    .map((batch: AnimalBatch) => {
      return {
        icon: BatchIcon,
        identification: chooseIdentification(batch),
        type: chooseAnimalTypeLabel(batch, defaultAnimalTypes, customAnimalTypes),
        breed: chooseAnimalBreedLabel(batch, defaultAnimalBreeds, customAnimalBreeds),
        groups: batch.group_ids.map((id: number) => getProperty(animalGroups, id, 'name')),
        path: `/batch/${batch.internal_identifier}`,
        count: batch.count,
        batch: true,
      };
    });
};

interface BuildInventoryArgs {
  animals: Animal[];
  animalBatches: AnimalBatch[];
  animalGroups: AnimalGroup[];
  customAnimalBreeds: CustomAnimalBreed[];
  customAnimalTypes: CustomAnimalType[];
  defaultAnimalBreeds: DefaultAnimalBreed[];
  defaultAnimalTypes: DefaultAnimalType[];
  animalsOrBatchesFilter: FilterState;
  typesFilter: FilterState;
  breedsFilter: FilterState;
  sexFilter: FilterState;
  groupsFilter: FilterState;
  locationsFilter: FilterState;
}

export const buildInventory = ({
  animals,
  animalBatches,
  animalGroups,
  customAnimalBreeds,
  customAnimalTypes,
  defaultAnimalBreeds,
  defaultAnimalTypes,
  animalsOrBatchesFilter,
  typesFilter,
  breedsFilter,
  sexFilter,
  groupsFilter,
  locationsFilter,
}: BuildInventoryArgs) => {
  const inventory = [
    ...formatAnimalsData(
      animals,
      animalGroups,
      customAnimalBreeds,
      customAnimalTypes,
      defaultAnimalBreeds,
      defaultAnimalTypes,
      animalsOrBatchesFilter,
      typesFilter,
      breedsFilter,
      sexFilter,
      groupsFilter,
      locationsFilter,
    ),
    ...formatAnimalBatchesData(
      animalBatches,
      animalGroups,
      customAnimalBreeds,
      customAnimalTypes,
      defaultAnimalBreeds,
      defaultAnimalTypes,
      animalsOrBatchesFilter,
      typesFilter,
      breedsFilter,
      sexFilter,
      groupsFilter,
      locationsFilter,
    ),
  ];

  const sortedInventory = inventory.sort(getComparator(orderEnum.ASC, 'identification'));

  return sortedInventory;
};

interface useAnimalInventoryArgs {
  animalsOrBatchesFilter: FilterState;
  typesFilter: FilterState;
  breedsFilter: FilterState;
  sexFilter: FilterState;
  groupsFilter: FilterState;
  locationsFilter: FilterState;
}

const useAnimalInventory = ({
  animalsOrBatchesFilter,
  typesFilter,
  breedsFilter,
  sexFilter,
  groupsFilter,
  locationsFilter,
}: useAnimalInventoryArgs) => {
  const { data, isLoading } = useQueries([
    { label: 'animals', hook: useGetAnimalsQuery },
    { label: 'animalBatches', hook: useGetAnimalBatchesQuery },
    { label: 'animalGroups', hook: useGetAnimalGroupsQuery },
    { label: 'customAnimalBreeds', hook: useGetCustomAnimalBreedsQuery },
    { label: 'customAnimalTypes', hook: useGetCustomAnimalTypesQuery },
    { label: 'defaultAnimalBreeds', hook: useGetDefaultAnimalBreedsQuery },
    { label: 'defaultAnimalTypes', hook: useGetDefaultAnimalTypesQuery },
    { label: 'animalSexes', hook: useGetAnimalSexesQuery },
  ]);

  const {
    animals,
    animalBatches,
    animalGroups,
    customAnimalBreeds,
    customAnimalTypes,
    defaultAnimalBreeds,
    defaultAnimalTypes,
  } = data;

  const inventory = useMemo(() => {
    if (isLoading) {
      return [];
    }
    if (
      animals &&
      animalBatches &&
      animalGroups &&
      customAnimalBreeds &&
      customAnimalTypes &&
      defaultAnimalBreeds &&
      defaultAnimalTypes
    ) {
      return buildInventory({
        animals,
        animalBatches,
        animalGroups,
        customAnimalBreeds,
        customAnimalTypes,
        defaultAnimalBreeds,
        defaultAnimalTypes,
        animalsOrBatchesFilter,
        typesFilter,
        breedsFilter,
        sexFilter,
        groupsFilter,
        locationsFilter,
      });
    }
    return [];
  }, [
    isLoading,
    animals,
    animalBatches,
    animalGroups,
    customAnimalBreeds,
    customAnimalTypes,
    defaultAnimalBreeds,
    defaultAnimalTypes,
    animalsOrBatchesFilter,
    typesFilter,
    breedsFilter,
    sexFilter,
    groupsFilter,
    locationsFilter,
  ]);

  return { inventory, isLoading };
};

export default useAnimalInventory;
