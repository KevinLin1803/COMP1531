import { getData, setData } from './dataStore';

import {
  DataStore,
  OutputDm,
  OutputUser,
  Message,
} from './helper';

import {
  getUserIndex,
  getUserPropertyFromToken,
  isUserPropertyValid,
  createDmId,
  isFeatureValid,
  getFeatureIndex,
  isUserMemberOfDm,
  getFeatureMemberIndex
} from './helper';

import HTTPError from 'http-errors';
import { statTracker } from './users';

function dmCreateV1(token: string, uIds: number[]) {
  const data : DataStore = getData();
  if (!(isUserPropertyValid('token', token))) {
    return { error: 'error' };
  }
  const nameArr : string[] = [];
  const memberArr : OutputUser[] = [];
  for (let i = 0; i < uIds.length; i++) {
    if ((!(isUserPropertyValid('uId', uIds[i]))) || uIds.indexOf(uIds[i]) !== i) {
      return { error: 'error' };
    } else {
      const index : number = getUserIndex('uId', uIds[i]);
      nameArr.push(data.users[index].handleStr);
      memberArr.push({
        uId: data.users[index].uId,
        email: data.users[index].email,
        nameFirst: data.users[index].nameFirst,
        nameLast: data.users[index].nameLast,
        handleStr: data.users[index].handleStr
      });
    }
  }
  nameArr.push(`${getUserPropertyFromToken('handleStr', token)}`);
  nameArr.sort();
  const dmId: number = createDmId(data);
  const newDmOwner : OutputUser = {
    uId: parseInt(`${getUserPropertyFromToken('uId', token)}`),
    email: `${getUserPropertyFromToken('email', token)}`,
    nameFirst: `${getUserPropertyFromToken('nameFirst', token)}`,
    nameLast: `${getUserPropertyFromToken('nameLast', token)}`,
    handleStr: `${getUserPropertyFromToken('handleStr', token)}`
  };
  memberArr.push(newDmOwner);
  data.dms.push({
    dmId: dmId,
    name: nameArr.join(', '),
    owner: newDmOwner,
    members: memberArr,
    messages: []
  });
  setData(data);
  statTracker('dmsJoined', parseInt(`${getUserPropertyFromToken('uId', token)}`), 1, 'dmsExist');
  for (const user of uIds) {
    statTracker('dmsJoined', user, 1);
  }
  return { dmID: dmId };
}

function dmListV1(token: string) {
  const data : DataStore = getData();
  if (!(isUserPropertyValid('token', token))) {
    return { error: 'error' };
  }
  const authUserId = getUserPropertyFromToken('uId', token);
  const outputArr : OutputDm[] = [];
  for (let i = 0; i < data.dms.length; i++) {
    if (data.dms[i].members.some(object => object.uId === authUserId)) {
      outputArr.push({
        dmId: data.dms[i].dmId,
        name: data.dms[i].name
      });
    }
  }
  outputArr.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
  return { dms: outputArr };
}

function dmRemoveV1(token: string, dmId: number) {
  const data : DataStore = getData();
  if (!(isUserPropertyValid('token', token))) {
    return { error: 'error' };
  }
  const authUserId = getUserPropertyFromToken('uId', token);
  if (!(isFeatureValid('dms', dmId))) {
    return { error: 'error' };
  } else {
    const index = getFeatureIndex('dms', dmId);
    if (!(data.dms[index].owner.uId === authUserId)) {
      return { error: 'error' };
    } else {
      data.dms[index].members = [];
      setData(data);

      statTracker('dmsJoined', authUserId, -1, 'dmsExist');

      for (const member of data.dms[index].members) {
        if (member.uId !== authUserId) {
          statTracker('dmsJoined', member.uId, -1);
        }
      }

      return {};
    }
  }
}

function dmDetailsV1 (token: string, dmId: number) {
  if (!(isUserPropertyValid('token', token))) {
    throw HTTPError(403, 'Invalid token');
  }

  const data : DataStore = getData();
  const user = Number(getUserPropertyFromToken('uId', token));

  if (isFeatureValid('dms', dmId) && isUserMemberOfDm(user, dmId)) {
    const dmIndex = Number(getFeatureIndex('dms', dmId));
    return { name: data.dms[dmIndex].name, members: data.dms[dmIndex].members };
  } else if (!isFeatureValid('dms', dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  } else {
    throw HTTPError(403, 'User not a member of the dm');
  }
}

function dmLeaveV1 (token: string, dmId: number) {
  if (!(isUserPropertyValid('token', token))) {
    throw HTTPError(403, 'Invalid token');
  }

  const data : DataStore = getData();

  const user = Number(getUserPropertyFromToken('uId', token));

  if (isFeatureValid('dms', dmId) && isUserMemberOfDm(user, dmId)) {
    const dmIndex = Number(getFeatureIndex('dms', dmId));
    const memberIndex = Number(getFeatureMemberIndex('dms', dmId, user));
    data.dms[dmIndex].members.splice(memberIndex, 1);
    setData(data);
    statTracker('dmsJoined', user, -1);
    return {};
  } else if (!isFeatureValid('dms', dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  } else {
    throw HTTPError(403, 'User not a member of the dm');
  }
}

function dmMessagesV1 (token: string, dmId: number, start: number) {
  if (!(isUserPropertyValid('token', token))) {
    throw HTTPError(403, 'Invalid token');
  }

  const data : DataStore = getData();
  const user = Number(getUserPropertyFromToken('uId', token));

  if (!isFeatureValid('dms', dmId)) {
    throw HTTPError(400, 'Invalid dmId');
  }

  const dmIndex = Number(getFeatureIndex('dms', dmId));
  const numDmMessages : number = data.dms[dmIndex].messages.length;

  if (isUserMemberOfDm(user, dmId) && numDmMessages > start) {
    const messageArr : Message [] = [];

    let i = 0;

    while (start + i < numDmMessages && i < 50) {
      messageArr.push({
        messageId: data.dms[dmIndex].messages[numDmMessages - (start + i) - 1].messageId,
        uId: data.dms[dmIndex].messages[numDmMessages - (start + i) - 1].uId,
        message: data.dms[dmIndex].messages[numDmMessages - (start + i) - 1].message,
        timeSent: data.dms[dmIndex].messages[numDmMessages - (start + i) - 1].timeSent,
        reacts: [],
        pinned: false
      });
      i++;
    }

    const end : number = i === 50 && (start + 50) !== numDmMessages ? start + 50 : -1;

    return ({
      messages: messageArr,
      start: start,
      end: end
    });
  } else if (!isUserMemberOfDm(user, dmId)) {
    throw HTTPError(403, 'User not a member of the dm');
  } else if (numDmMessages === 0 && start === 0) {
    return ({
      messages: [],
      start: 0,
      end: -1
    });
  } else {
    throw HTTPError(400, 'invalid start input');
  }
}

export { dmCreateV1, dmListV1, dmRemoveV1, dmDetailsV1, dmLeaveV1, dmMessagesV1 };
