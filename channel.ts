import { getData, setData } from './dataStore';
import {
  User,
  OutputUser,
  OutputChannel,
  DataStore,
  ReturnChannelCreate,
  isTokenValid,
} from './helper';
import {
  createChannelName,
  createChannelId,
  isUserPropertyValid,
  getUserPropertyFromToken
} from './helper';
import HTTPError from 'http-errors';
import { statTracker } from './users';

/**
 * Function which takes in three parameters and creates a channel and adds it to the dataStore file if all parameters are valid, with the user who created the channel automatically being added to it.
 * If channel has the same name as another, I have made the assumption that it will simply be given a number suffix starting from 1 up till a unique name is found.
 *
 * @param {string} token:         token of the user attempting to create the channel
 * @param {string} name:          name that the user wants to call the channel
 * @param {boolean} isPublic:     boolean value representing whether the channel is public or private
 * @returns {number}  channelId:  a unique id which belongs to no other channel, and is made by starting from 1 and counting up till a unique id can be found
 *
 */
function channelsCreateV2(token : string, name : string, isPublic : boolean) {
  const data : DataStore = getData();
  const tokenValid = isTokenValid(token);
  if (name.length < 1 || name.length > 50 || !tokenValid) {
    console.log('channelsCreate Error');
    return { error: 'error' };
  } else {
    const channelName : string = createChannelName(data, name);
    const channelId : number = createChannelId(data);
    const authUser : User = data.users.find(user => user.token.includes(token));
    const authData : OutputUser = {
      uId: authUser.uId,
      email: authUser.email,
      nameFirst: authUser.nameFirst,
      nameLast: authUser.nameLast,
      handleStr: authUser.handleStr
    };
    data.channels.push({
      cId: channelId,
      name: channelName,
      isPublic: isPublic,
      ownerMembers: [authData],
      allMembers: [authData],
      messages: [],
    });
    setData(data);
    const returner: ReturnChannelCreate = { channelId: channelId };

    statTracker('channelsJoined', authUser.uId, 1, 'channelsExist');

    return returner;
  }
}

function channelsListV3(token : string) {
  const data : DataStore = getData();

  if (!isUserPropertyValid('token', token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const channelArr : OutputChannel[] = [];

  const user = Number(getUserPropertyFromToken('uId', token));

  for (const channel of data.channels) {
    for (const users of channel.allMembers) {
      if (user === users.uId) {
        channelArr.push({
          channelId: channel.cId,
          name: channel.name
        });
      }
    }
  }

  return { channels: channelArr };
}

// Function which takes in one object parameter(authUserId) and lists all the channels both private and public
// It is assumed that if the authUserId is invalid that an error will be returned
function channelsListallV3(token : string) {
  const data : DataStore = getData();

  if (!isUserPropertyValid('token', token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const channelArr : OutputChannel[] = [];

  for (const channel of data.channels) {
    channelArr.push({
      channelId: channel.cId,
      name: channel.name
    });
  }

  return { channels: channelArr };
}

export { channelsCreateV2 };
export { channelsListV3 };
export { channelsListallV3 };