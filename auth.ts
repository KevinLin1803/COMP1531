import validator from 'validator';
import { getData, setData } from './dataStore';
import {
  DataStore,
  createToken,
  isUserPropertyValid,
  isCorrectPassword,
  getUserIndex,
  createHandle,
  createId,
  createTimeStamp,
} from './helper';
import fs from 'fs';
import request from 'sync-request';
import { port } from './config.json';

export interface channelsJoined {
  numChannelsJoined?: number,
  timeStamp?: number
}

export interface dmsJoined {
  numDmsJoined?: number,
  timeStamp?: number
}

export interface messagesSent {
  numMessagesSent?: number,
  timeStamp?: number
}

export interface channelsExist {
  numChannelsExist?: number,
  timeStamp?: number
}

export interface dmsExist {
  numDmsExist?: number,
  timeStamp?: number
}

export interface messagesExist {
  numMessagesExist?: number,
  timeStamp?: number
}

export interface userStats {
  channelsJoined: channelsJoined [],
  dmsJoined: dmsJoined [],
  messagesSent: messagesSent[],
  involvementRate: number
}

export interface workspaceStats {
  channelsExist: channelsExist [],
  dmsExist: dmsExist [],
  messagesExist: messagesExist[],
  utilizationRate: number
}

/**
 * Function which validates whether user is registered and then whether their password is valid. If it's valid, the user is logged in and provided a token
 *
 * @param {string} email:           user's email
 * @param {string} password:        user's password
 * @returns {string, number}  If details are vaild, function returns an object containing the users newly generated token and their authUserId, else returns {error : 'error'}
 *
 */
function authLoginV2(email : string, password : string) {
  if (isUserPropertyValid('email', email) && isCorrectPassword(password, email)) {
    const data : DataStore = getData();
    const userIndex : number = getUserIndex('email', email);
    const token : string = createToken();
    return { token: token, authUserId: data.users[userIndex].uId };
  } else {
    return { error: 'error' };
  }
}

export function authLogoutV1(token: string) {
  const data: DataStore = getData();

  if (!isUserPropertyValid('token', token)) {
    return { error: 'error' };
  }

  const index: number = getUserIndex('token', token);
  data.users[index].token.splice(data.users[index].token.indexOf(token), 1);
  setData(data);

  return {};
}

// Function which takes in 4 parameters, and creates a user if the email is unregistered, and the other parameters are valid (i.e passwords > 6 characters,
// names between 1-50 characters). The user is then given a unique id number starting from 1 upwards. They are also given a handle string which is a concatenation
// of the lowercase version of their first and last name, with any non-alphanumeric characters removed. If two users have the same handlestr, then the latest user
// to sign up will be given a simple number suffix counting from 1 upwards.
function authRegisterV2(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
) {
  /* checks before person can be registered:
  1. valid email (using validator)
  2. ensure email has not already been registered
  3. password longer than 6 characters (INCLUSIVE of 6)
  4. First/Last name between 1-50 characters inclusive
  */

  const data: DataStore = getData();

  const isAlreadyRegistered: boolean = data.users.some(
    (users) => users.email === email
  );
  const isValidEmail: boolean = validator.isEmail(email);
  const isValidPassword: boolean = password.length >= 6;
  const isValidFirstName = !!(nameFirst.length >= 1 && nameFirst.length <= 50);
  const isValidLastName = !!(nameLast.length >= 1 && nameLast.length <= 50);

  if (
    !isAlreadyRegistered &&
    isValidEmail &&
    isValidPassword &&
    isValidFirstName &&
    isValidLastName
  ) {
    const handleStr: string = createHandle(data, nameFirst, nameLast);
    const userId: number = createId(data);
    let globalPermissionId = 2;

    if (data.users.length === 0) {
      globalPermissionId = 1;
    }

    const token: string = createToken();

    const res = request('GET', 'http://aow.triumph.net/wp-content/uploads/2014/01/Reborn-Wallpaper-katekyo-hitman-reborn-v2.jpg');
    const image = res.getBody();

    fs.writeFileSync('images/default.jpg', image, { flag: 'w' });

    data.users.push({
      uId: userId,
      nameFirst: nameFirst,
      nameLast: nameLast,
      email: email,
      password: password,
      handleStr: handleStr,
      globalPermissionId: globalPermissionId,
      token: [],
      profileImgUrl: `http://localhost:${port}/static/default.jpg`
    });

    data.users[data.users.length - 1].token.push(token);
    setData(data);

    const userStats : userStats = {
      channelsJoined: [{ numChannelsJoined: 0, timeStamp: createTimeStamp() }],
      dmsJoined: [{ numDmsJoined: 0, timeStamp: createTimeStamp() }],
      messagesSent: [{ numMessagesSent: 0, timeStamp: createTimeStamp() }],
      involvementRate: 0
    };

    fs.writeFileSync(`${userId}.json`, JSON.stringify(userStats), { flag: 'w' });

    if (data.users.length === 1) {
      const workspaceStats : workspaceStats = {
        channelsExist: [{ numChannelsExist: 0, timeStamp: createTimeStamp() }],
        dmsExist: [{ numDmsExist: 0, timeStamp: createTimeStamp() }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: createTimeStamp() }],
        utilizationRate: 0,
      };

      fs.writeFileSync('workspaceStats.json', JSON.stringify(workspaceStats), { flag: 'w' });
    }

    return { token: token, authUserId: userId };
  } else {
    return { error: 'error' };
  }
}

export { authRegisterV2, authLoginV2 };
