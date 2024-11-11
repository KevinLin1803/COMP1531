import { getData, setData } from './dataStore';
import {
  DataStore,
  isUserPropertyValid,
  getUserIndex,
  OutputUser,
  isAlphaNumeric,
  getUserPropertyFromToken,
  createTimeStamp,
} from './helper';
import request from 'sync-request';
import fs from 'fs';
import validator from 'validator';
import HTTPError from 'http-errors';
const sharp = require('sharp');
const sizeOf = require('image-size');
import { port } from './config.json';
import {workspaceStats, userStats, channelsExist, dmsExist, messagesExist, channelsJoined, dmsJoined, messagesSent} from './auth'

// Function which takes in 2 parameters, and returns information (uId, first name, last name, email, handle) about a user given their
// information (uid) is valid (stored inside dataStore).

function userProfileV2(token: string, uId: number) {
  const data: DataStore = getData();

  if (!isUserPropertyValid('token', token)) {
    return { error: 'error' };
  }
  if (!isUserPropertyValid('uId', uId)) {
    return { error: 'error' };
  }

  const index: number = getUserIndex('uId', uId);
  return {
    user: {
      uId: data.users[index].uId,
      email: data.users[index].email,
      nameFirst: data.users[index].nameFirst,
      nameLast: data.users[index].nameLast,
      handleStr: data.users[index].handleStr,
    },
  };
}

function usersAllV1(token: string) {
  const data: DataStore = getData();
  const outputArray: OutputUser[] = [];

  if (!isUserPropertyValid('token', token)) {
    return { error: 'error' };
  }

  for (const token in data.users) {
    outputArray.push({
      uId: data.users[token].uId,
      nameFirst: data.users[token].nameFirst,
      nameLast: data.users[token].nameLast,
      handleStr: data.users[token].handleStr,
      email: data.users[token].email,
    });
  }
  return { users: outputArray };
}

function userProfileSetNameV1(
  token: string,
  nameFirst: string,
  nameLast: string
) {
  const data: DataStore = getData();
  if (!isUserPropertyValid('token', token)) {
    return { error: 'error' };
  }

  const isValidFirstName: boolean =
    nameFirst.length >= 1 && nameFirst.length <= 50;
  const isValidLastName: boolean =
    nameLast.length >= 1 && nameLast.length <= 50;
  if (!isValidFirstName || !isValidLastName) {
    return { error: 'error' };
  }

  const index: number = getUserIndex('token', token);
  data.users[index].nameFirst = nameFirst;
  data.users[index].nameLast = nameLast;
  setData(data);

  return {};
}

function userProfileSetEmailV1(token: string, email: string) {
  const data: DataStore = getData();
  if (!isUserPropertyValid('token', token)) {
    return { error: 'error' };
  }

  if (isUserPropertyValid('email', email)) {
    return { error: 'error' };
  }

  const isValidEmail: boolean = validator.isEmail(email);
  if (!isValidEmail) {
    return { error: 'error' };
  }

  const index: number = getUserIndex('token', token);
  data.users[index].email = email;
  setData(data);

  return {};
}

function userProfileSetHandleV1(token: string, handleStr: string) {
  const data: DataStore = getData();
  if (!isUserPropertyValid('token', token)) {
    return { error: 'error' };
  }

  if (isUserPropertyValid('handleStr', handleStr)) {
    return { error: 'error' };
  }

  const isValidLength: boolean =
    handleStr.length >= 3 && handleStr.length <= 20;
  if (!isValidLength || !isAlphaNumeric(handleStr)) {
    return { error: 'error' };
  }

  const index: number = getUserIndex('token', token);
  data.users[index].handleStr = handleStr;
  setData(data);

  return {};
}

export function userProfileUploadPhoto (token: string, imgURL: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  if (!isUserPropertyValid('token', token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const data = getData();

  if (!imgURL.includes('jpg') && !imgURL.includes('JPG')) {
    throw HTTPError(400, 'Invalid image URL');
  }

  if (xEnd <= xStart || yEnd <= yStart) {
    throw HTTPError(400, 'Invalid bound entries');
  }

  const uId = Number(getUserPropertyFromToken('uId', token));

  const res = request('GET', imgURL);
  if (res.statusCode !== 200) {
    throw HTTPError(400, 'Image could not be retrieved');
  }
  const image = res.getBody();

  const timeStamp = createTimeStamp();

  fs.writeFileSync(`images/${uId}.jpg`, image, { flag: 'w' });

  const dimensions = sizeOf(`images/${uId}.jpg`);

  if (xStart > dimensions.width || xEnd > dimensions.width || yStart > dimensions.height || yEnd > dimensions.height) {
    throw HTTPError(400, 'Invalid bound entries');
  }

  sharp(`images/${uId}.jpg`).extract({ width: xEnd - xStart, height: yEnd - yStart, left: xStart, top: yStart }).toFile(`images/${uId}-${timeStamp}.jpg`)
    .catch((err) => {
      console.log(`Error was ${err}`);
    });

  for (const user of data.users) {
    if (user.uId === uId) {
      user.profileImgUrl = `http://localhost:${port}/static/${uId}-${timeStamp}.jpg`;
      setData(data);
    }
  }

  setData(data);
  return {};
}

export function userStatsV1 (token: string) {
  if (!isUserPropertyValid('token', token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const uId = Number(getUserPropertyFromToken('uId', token));
  calcRates('involve', uId);

  const userStats = JSON.parse(fs.readFileSync(`${uId}.json`, 'utf8'));

  return { userStats: userStats };
}

export function usersStatsV1 (token: string) {
  if (!isUserPropertyValid('token', token)) {
    throw HTTPError(403, 'Invalid token');
  }

  calcRates('utilise');

  const workspaceStats = JSON.parse(fs.readFileSync('workspaceStats.json', 'utf8'));

  return { workspaceStats: workspaceStats };
}

export { userProfileV2, usersAllV1, userProfileSetEmailV1, userProfileSetHandleV1, userProfileSetNameV1 };

function getTotalMsgs() {
  const data = getData();

  let nummessages = 0;
  for (const dm of data.dms) {
    nummessages = nummessages + dm.messages.length;
  }

  for (const channel of data.channels) {
    nummessages = nummessages + channel.messages.length;
  }

  return nummessages;
}

export function calcRates(type: 'involve' | 'utilise', uId?: number) {
  const data = getData();
  let rate = 0;

  if (type === 'involve') {
    const userStats = JSON.parse(fs.readFileSync(`${uId}.json`, 'utf8'));
    const numChannelsJoined = userStats.channelsJoined.length === 0 ? 0 : userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined;
    const numDmsJoined = userStats.dmsJoined.length === 0 ? 0 : userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined;
    const numMsgsSent = userStats.messagesSent.length === 0 ? 0 : userStats.messagesSent[userStats.messagesSent.length - 1].numMessagesSent;

    rate = (numChannelsJoined + numDmsJoined + numMsgsSent) / (data.channels.length + data.dms.length + getTotalMsgs());
    console.log(data.dms.length);

    if ((data.channels.length + data.dms.length + getTotalMsgs()) === 0) {
      rate = 0;
    }

    if (rate > 1) {
      rate = 1;
    }

    userStats.involvementRate = rate;

    fs.writeFileSync(`${uId}.json`, JSON.stringify(userStats), { flag: 'w' });
  } else {
    const workspaceStats = JSON.parse(fs.readFileSync('workspaceStats.json', 'utf8'));
    let numUsersJoinedOne = 0;

    for (const user of data.users) {
      const userStats = JSON.parse(fs.readFileSync(`${user.uId}.json`, 'utf8'));

      if (userStats.channelsJoined[userStats.channelsJoined.length - 1].numChannelsJoined > 0 ||
          userStats.dmsJoined[userStats.dmsJoined.length - 1].numDmsJoined > 0) {
        numUsersJoinedOne++;
      }
    }

    rate = numUsersJoinedOne / data.users.length;
    workspaceStats.utilizationRate = rate;

    if (rate > 1) {
      rate = 1;
    }

    fs.writeFileSync('workspaceStats.json', JSON.stringify(workspaceStats), { flag: 'w' });
  }
}

export function statTracker (userStat: string, authUserId: number, change: number, workspaceStat?: string) {
  if (userStat !== '' && authUserId !== -1) {
    const userStats : userStats = JSON.parse(fs.readFileSync(`${authUserId}.json`, 'utf8'));

    const length : number = userStats[userStat].length;

    const statKey : string = createStatKey(userStat);

    const updateStat : channelsJoined | dmsJoined | messagesSent = {};
    const stats : channelsJoined []| dmsJoined []| messagesSent [] = userStats[userStat];
    const prevStat : channelsJoined | dmsJoined | messagesSent  = stats[length - 1];

    updateStat[statKey] = prevStat[statKey] + change;
    updateStat['timeStamp'] = createTimeStamp();

    userStats[userStat].push(updateStat);
    fs.writeFileSync(`${authUserId}.json`, JSON.stringify(userStats), { flag: 'w' });
  }

  if (workspaceStat !== undefined) {
    const workspaceStats : workspaceStats = JSON.parse(fs.readFileSync('workspaceStats.json', 'utf8'));

    const arrLength : number = workspaceStats[workspaceStat].length;

    const statKey : string = createStatKey(workspaceStat);
    const newStat : channelsExist | dmsExist | messagesExist = {};
    const stats : channelsExist [] | dmsExist [] | messagesExist []= workspaceStats[workspaceStat];
    const oldStat : channelsExist | dmsExist | messagesExist = stats[arrLength - 1];

    newStat[statKey] = oldStat[statKey] + change;
    newStat['timeStamp'] = createTimeStamp();

    workspaceStats[workspaceStat].push(newStat);
    fs.writeFileSync('workspaceStats.json', JSON.stringify(workspaceStats), { flag: 'w' });
  }
}

export function createStatKey (stat: string) {
  const statKey = 'num' + stat.charAt(0).toUpperCase() + stat.slice(1);

  return statKey;
}
