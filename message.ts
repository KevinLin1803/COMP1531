import { getData, setData } from './dataStore';
import { isTokenValid, getUserPropertyFromToken, createMessageId, createTimeStamp, isUserPropertyValid, isFeatureValid, isUserMemberOfDm, getFeatureIndex } from './helper';
import { DataStore } from './helper';
import { statTracker } from './users';

/**
 * Function which sends a user-inputted message from a user to a specified channel/DM, checking that the user is a member of that channel.
 * If the length of the message is < 1 or > 1000 that also causes the function to throw an error
 *
 * @param {string} token:         the token of the user trying to send the message
 * @param {number} channelId:     the channel which the user wants to send the message too
 * @param {string} message:       the message itself
 *
 * @returns {number}  messageId:    a unique id which belongs to no other message, and is made by starting from 1 and counting up till a unique id can be found
 *                                  Also returns {error : 'error' } if any of the required conditions are not met.
 */
export function messageSendV1(token : string, channelId : number, message : string) {
  if (!isTokenValid(token)) {
    return { error: 'error' };
  }

  const data = getData();
  const authUserId = Number(getUserPropertyFromToken('uId', token));
  let isValidChannelAndUser = false;
  let isValidMessage = false;

  // Check channalId is valid and that the token refers to a user that is the owner of that channel.
  // Also checks that the length of the message is greater than 0 and less than or equal to 1000. Returns error if either is false.

  data.channels.some(channel => (channel.cId === channelId) && (channel.allMembers.some(member => member.uId === authUserId))) ? isValidChannelAndUser = true : isValidChannelAndUser = false;
  message.length > 1000 ? isValidMessage = false : (message.length < 1 ? isValidMessage = false : isValidMessage = true);
  if (!(isValidChannelAndUser && isValidMessage)) {
    return { error: 'error' };
  }

  const messageId = createMessageId();
  for (const channel of data.channels) {
    if (channel.cId === channelId) {
      channel.messages.push({ messageId: messageId, uId: authUserId, message: message, timeSent: createTimeStamp(), reacts: [], pinned: false });
    }
  }
  setData(data);

  statTracker('messagesSent', authUserId, 1, 'messagesExist');
  /*
  const userStats = JSON.parse(fs.readFileSync(`${authUserId}.json`, 'utf8'));
  const workspaceStats = JSON.parse(fs.readFileSync(`workspaceStats.json`, 'utf8'));

  const numMessagesSent = userStats.messagesSent.length
  if (numMessagesSent !== 0 ) {
    userStats.MessagesSent.push({numMessagesSent: userStats.MessagesSent[numMessagesSent - 1].numMessagesSent + 1,
                                   timestamp: createTimeStamp()});
  } else {
    userStats.MessagesSent.push({numMessagesSent: 1,
                                   timestamp: createTimeStamp()});
  }

  const numMessagesExist = workspaceStats.messagesExist.length

  if (numMessagesExist !== 0 ) {
    workspaceStats.MessagesExist.push({numMessagesExist: workspaceStats.MessagesExist[numMessagesExist - 1].numMessagesExist + 1,
                                   timestamp: createTimeStamp()});
  } else {
    workspaceStats.MessagesExist.push({numMessagesExist: 1,
                                   timestamp: createTimeStamp()});
  }

  fs.writeFileSync(`${authUserId}.json`, JSON.stringify(userStats), { flag: 'w'});
  fs.writeFileSync(`workspaceStats.json`, JSON.stringify(workspaceStats), { flag: 'w'});
  */
  return { messageId: messageId };
}

/**
 * Function which takes in the parameters token, messageId and message, and then checks whether the user with the provided token is allowed
 * to edit the message (i.e if they either authored the messaeg, or are an admin of the channel/dm the message is from). If valid,
 * the message is edited if the message length is not 0, and deletes otherwise.
 *
 * @param {string} token:         the token of the user trying to send the message
 * @param {number} messageId:     the message which the user wants to edit
 * @param {string} message:       the message which the user wants to send
 *
 * @returns {}  returns an empty object if well, and {error : 'error' } if any of the required conditions are not met.
 *
 */
export function messageEditV1(token : string, messageId : number, message : string) {
  if (!isTokenValid(token)) {
    return { error: 'error' };
  }

  const data = getData();
  const authUserId = getUserPropertyFromToken('uId', token);
  let isValidEdit = false;
  let isValidMessage = false;

  // Checks if messageId refers to a valid message, and then whether either the token belongs to the user who created the message, or the token belongs to an admin of theat channel.
  for (const channels of data.channels) {
    for (const messages of channels.messages) {
      if (messages.messageId === messageId && (channels.ownerMembers.some(member => member.uId === authUserId) || messages.uId === authUserId)) {
        isValidEdit = true;
      }
    }
  }

  for (const dms of data.dms) {
    for (const messages of dms.messages) {
      if (messages.messageId === messageId && (dms.owner.uId === authUserId || messages.uId === authUserId)) {
        isValidEdit = true;
      }
    }
  }

  if (message.length <= 1000) {
    isValidMessage = true;
  }

  let messageFound = false;

  // if the edit call is valid, then it finds the message (by first checking channel messages then dm messages),
  // and deletes it if length of message is 0, or edits it otherwise
  if (isValidEdit && isValidMessage) {
    for (const channel of data.channels) {
      for (const messages of channel.messages) {
        if (messages.messageId === messageId) {
          messageFound = true;
          if (message.length !== 0) {
            messages.message = message;
          } else {
            const index = channel.messages.findIndex(message => message.messageId === messageId);
            channel.messages.splice(index, 1);

            statTracker('', -1, -1, 'messagesExist');
            /*
            const userStats = JSON.parse(fs.readFileSync(`${authUserId}.json`, 'utf8'));
            const workspaceStats = JSON.parse(fs.readFileSync(`workspaceStats.json`, 'utf8'));

            const numMessagesSent = userStats.messagesSent.length

            userStats.MessagesSent.push({numMessagesSent: userStats.MessagesSent[numMessagesSent - 1].numMessagesSent - 1,
                                         timestamp: createTimeStamp()});

            const numMessagesExist = workspaceStats.messagesExist.length;

            workspaceStats.MessagesExist.push({numMessagesExist: workspaceStats.MessagesExist[numMessagesExist - 1].numMessagesExist - 1,
                                               timestamp: createTimeStamp()});

            fs.writeFileSync(`${authUserId}.json`, JSON.stringify(userStats), { flag: 'w'});
            fs.writeFileSync(`workspaceStats.json`, JSON.stringify(workspaceStats), { flag: 'w'});
            */
          }
        }
      }
    }
  } else {
    return { error: 'error' };
  }

  if (isValidEdit && isValidMessage && !messageFound) {
    for (const dm of data.dms) {
      for (const messages of dm.messages) {
        if (messages.messageId === messageId) {
          messageFound = true;
          if (message.length !== 0) {
            messages.message = message;
          } else {
            const index = dm.messages.findIndex(message => message.messageId === messageId);
            dm.messages.splice(index, 1);
          }
        }
      }
    }
  }

  setData(data);
  return {};
}

/**
 * Function which takes in the parameters token and messageID. It then checks whether the user with the provided token
 * is authorised to remove a message (i.e they either authored the message or are an admin in the channel/dm), and then removes
 * accordingly.
 *
 * @param {string} token:         the token of the user trying to send the message
 * @param {number} messageId:     the message which the user wants to remove
 *
 * @returns {}  returns an empty object if the function carried out accordingly, but returns { error : 'error' } if an issue was caught
 */
export function messageRemoveV1(token : string, messageId : number) {
  console.log('we enetered message remove');
  console.log(token);
  console.log(messageId);

  if (!isTokenValid(token)) {
    return { error: 'error' };
  }

  const authUserId = getUserPropertyFromToken('uId', token);
  const data = getData();

  let isValidRemove;

  for (const channels of data.channels) {
    for (const messages of channels.messages) {
      if (messages.messageId === messageId && (channels.ownerMembers.some(member => member.uId === authUserId) || messages.uId === authUserId)) {
        isValidRemove = true;
      }
    }
  }

  for (const dms of data.dms) {
    for (const messages of dms.messages) {
      if (messages.messageId === messageId && (dms.owner.uId === authUserId || messages.uId === authUserId)) {
        isValidRemove = true;
      }
    }
  }

  let messageFound = false;
  if (isValidRemove) {
    for (const channel of data.channels) {
      for (const messages of channel.messages) {
        if (messages.messageId === messageId) {
          messageFound = true;
          const index = channel.messages.findIndex(message => message.messageId === messageId);
          channel.messages.splice(index, 1);
          console.log('We did the statTracker at remove :D');
          statTracker('', -1, -1, 'messagesExist');
        }
      }
    }
  } else {
    return { error: 'error' };
  }

  if (isValidRemove && !messageFound) {
    for (const dm of data.dms) {
      for (const messages of dm.messages) {
        if (messages.messageId === messageId) {
          messageFound = true;
          const index = dm.messages.findIndex(message => message.messageId === messageId);
          dm.messages.splice(index, 1);
          /*
          const userStats = JSON.parse(fs.readFileSync(`${authUserId}.json`, 'utf8'));
          const workspaceStats = JSON.parse(fs.readFileSync(`workspaceStats.json`, 'utf8'));

          const numMessagesSent = userStats.messagesSent.length

          userStats.MessagesSent.push({numMessagesSent: userStats.MessagesSent[numMessagesSent - 1].numMessagesSent - 1,
                                       timestamp: createTimeStamp()});

          const numMessagesExist = workspaceStats.messagesExist.length;

          workspaceStats.MessagesExist.push({numMessagesExist: workspaceStats.MessagesExist[numMessagesExist - 1].numMessagesExist - 1,
                                             timestamp: createTimeStamp()});

          fs.writeFileSync(`${authUserId}.json`, JSON.stringify(userStats), { flag: 'w'});
          fs.writeFileSync(`workspaceStats.json`, JSON.stringify(workspaceStats), { flag: 'w'});
          */
        }
      }
    }
  }

  return {};
}

export function messageSendDmV1(token: string, dmId: number, message: string) {
  if ((!isUserPropertyValid('token', token)) || !(isFeatureValid('dms', dmId)) || message.length > 1000 || message.length < 1) {
    return { error: 'error' };
  } else {
    const data : DataStore = getData();
    const authUserId = parseInt(`${getUserPropertyFromToken('uId', token)}`);
    if (!(isUserMemberOfDm(authUserId, dmId))) {
      return { error: 'error' };
    } else {
      const index = getFeatureIndex('dms', dmId);
      const messageId = createMessageId();
      data.dms[index].messages.push({
        messageId: messageId,
        uId: authUserId,
        message: message,
        timeSent: createTimeStamp(),
        reacts: [],
        pinned: false
      });
      setData(data);

      statTracker('messagesSent', authUserId, 1, 'messagesExist');
      /*
    const userStats = JSON.parse(fs.readFileSync(`${authUserId}.json`, 'utf8'));
    const workspaceStats = JSON.parse(fs.readFileSync(`workspaceStats.json`, 'utf8'));

    const numMessagesSent = userStats.messagesSent.length
    if (numMessagesSent !== 0 ) {
      userStats.MessagesSent.push({numMessagesSent: userStats.MessagesSent[numMessagesSent - 1].numMessagesSent + 1,
                                     timestamp: createTimeStamp()});
    } else {
      userStats.MessagesSent.push({numMessagesSent: 1,
                                     timestamp: createTimeStamp()});
    }

    const numMessagesExist = workspaceStats.messagesExist.length

    if (numMessagesExist !== 0 ) {
      workspaceStats.MessagesExist.push({numMessagesExist: workspaceStats.MessagesExist[numMessagesExist - 1].numMessagesExist + 1,
                                     timestamp: createTimeStamp()});
    } else {
      workspaceStats.MessagesExist.push({numMessagesExist: 1,
                                     timestamp: createTimeStamp()});
    }

    fs.writeFileSync(`${authUserId}.json`, JSON.stringify(userStats), { flag: 'w'});
    fs.writeFileSync(`workspaceStats.json`, JSON.stringify(workspaceStats), { flag: 'w'}); */

      return { messageId: messageId };
    }
  }
}
