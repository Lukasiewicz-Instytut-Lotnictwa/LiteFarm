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

import { Model, transaction } from 'objection';
import AnimalModel from '../models/animalModel.js';
import baseController from './baseController.js';

const animalController = {
  getFarmAnimals() {
    return async (req, res) => {
      try {
        const { farm_id } = req.headers;
        const rows = await AnimalModel.query().where({ farm_id });
        return res.status(200).send(rows);
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          error,
        });
      }
    };
  },

  addAnimal() {
    return async (req, res) => {
      try {
        const trx = await transaction.start(Model.knex());
        const { farm_id } = req.headers;

        if (!req.body.identifier && !req.body.name) {
          return res.status(400).send('Should send either animal name or identifier');
        }

        if (!req.body.default_breed_id && !req.body.custom_breed_id) {
          return res.status(400).send('Should send either default_breed_id or custom_breed_id');
        }

        const result = await baseController.upsertGraph(
          AnimalModel,
          { ...req.body, farm_id },
          req,
          { trx },
        );
        await trx.commit();
        return res.status(201).send(result);
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          error,
        });
      }
    };
  },
};

export default animalController;
