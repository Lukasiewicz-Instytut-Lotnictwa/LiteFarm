/*
 *  Copyright (c) 2024 LiteFarm.org
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

export const up = async function (knex) {
  // Sexes that are allowed to be used for reproduction
  const maleSex = await knex('animal_sex').select('*').where({ key: 'MALE' }).first();

  await knex.schema.alterTable('animal', (table) => {
    table.boolean('used_for_reproduction').nullable();
    table.check(
      `(used_for_reproduction IS NOT NULL AND (sex_id = ${maleSex.id})) OR used_for_reproduction IS NULL`,
      [],
      'reproduction_sex_check',
    );
  });

  const otherUse = await knex('animal_use').select('*').where({ key: 'OTHER' }).first();

  await knex.schema.createTable('animal_use_relationship', (table) => {
    table.increments('id').primary();
    table.integer('animal_id').references('id').inTable('animal').notNullable();
    table.integer('use_id').references('id').inTable('animal_use').notNullable();
    table.string('other_use');
    table.unique(['animal_id', 'use_id'], {
      indexName: 'animal_use_uniqueness_check',
    });
    table.check(
      `(other_use IS NOT NULL AND use_id = ${otherUse.id}) OR (other_use IS NULL)`,
      [],
      'other_use_id_check',
    );
  });
};

export const down = async function (knex) {
  await knex.schema.alterTable('animal', (table) => {
    table.dropChecks(['reproduction_sex_check']);
    table.dropColumn('used_for_reproduction');
  });

  await knex.schema.dropTable('animal_use_relationship');
};
