/*
 *  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 *  This file (fertilizerController.js) is part of LiteFarm.
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

import UserFarmModel from '../models/userFarmModel.js';
import NotificationUser from '../models/notificationUserModel.js';

/**
 * Controller for external API endpoints.
 */
const externalController = {
  /**
   * An endpoint to push notifications to the client.
   * This allows to add a notification to LiteFarm from external sources.
   * Request body should contain the following fields:
   * - title: The title of the notification,
   * - message: The message of the notification,
   * - date: The date of the notification (optional),
   * - ref: The reference of the notification (optional),
   * - task_translation_key: Icon for the notification (optional), check `getTaskTypeIcon`,
   * - icon_translation_key: Icon for the notification (optional), check `getNotificationTypeIcon`,
   * - users: Array of users to send the notification to (optional).
   *
   * Title and message are required and should object with
   * key `translation_key` that is used to translate the message
   * or with string per language for example:
   * ```json
   * {
   *   "en": "Title",
   *   "es": "Título"
   * }
   * ```
   *
   */
  pushNotification() {
    return async (req, resp) => {
      const { farm_id } = req.params;
      const activeUsers = await UserFarmModel.getActiveUsersFromFarmId(farm_id);
      const body = req.body;

      if (!body.title || !body.message) {
        return resp.status(400).send({ error: 'Title and message are required' });
      }

      // Get date of notification if provided
      let date;
      if (typeof body.date === 'number') {
        date = new Date(body.date).toISOString().split('T')[0];
      } else if (typeof body.date === 'string') {
        date = body.date;
      } else {
        date = new Date().toISOString().split('T')[0];
      }

      let users;
      if (!Array.isArray(body.users) || body.users.length === 0) {
        // if no users are provided, send to all active users
        users = activeUsers;
      } else {
        // Send to users provided in the request but limit to active users
        users = activeUsers.filter((user) => body.users.includes(user.user_id));
      }

      await NotificationUser.notify(
        {
          title: body.title,
          body: body.message,
          variables: [],
          ref: body.ref,
          context: {
            task_translation_key: body.task_translation_key,
            icon_translation_key: body.icon_translation_key,
            notification_type: body.notification_type,
            notification_date: date,
          },
          farm_id,
        },
        users,
      );
      resp.status(200).send({ message: 'Notification sent' });
    };
  },
};
export default externalController;
