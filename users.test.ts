import { ReturnAuthRegister, ErrorAuthRegister, ReturnChannelCreate, ErrorChannelCreate, ErrorMessageSend, ReturnMessageSend } from './helper';
import request, { HttpVerb } from 'sync-request';
import { url, port } from './config.json';

function reqHelper(method: HttpVerb, path: string, payload: object, token?: object) {
  let qs = {};
  let json = {};
  let headers = {};
  if (token !== undefined) {
    headers = token;
  }
  if (['GET', 'DELETE'].includes(method)) {
    qs = payload;
  } else {
    json = payload;
  }
  const res = request(method, `${url}:${port}${path}`, { qs, json, headers });
  if (res.statusCode !== 200) {
    return res.statusCode;
  }
  return JSON.parse(res.getBody() as string);
}
// ============================================================================

// ============================================================================
// HTTP Wrapper Functions
function authRegisterV2(email : string, password : string, nameFirst : string, nameLast : string) {
  return reqHelper('POST', '/auth/register/v2', { email, password, nameFirst, nameLast });
}

function clearV1() {
  return reqHelper('DELETE', '/clear/v1', {});
}

function dmCreateV1(token: string, uIds: number[]) {
  return reqHelper('POST', '/dm/create/v1', { uIds }, { token });
}

function dmRemoveV1(token: string, dmId: number) {
  return reqHelper('DELETE', '/dm/remove/v1', { dmId }, { token });
}

function messageSendDmV1(token: string, dmId: number, message: string) {
  return reqHelper('POST', '/message/senddm/v1', { dmId, message }, { token });
}

function userProfileUploadPhoto(token: string, profileImgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  return reqHelper('POST', '/user/profile/uploadphoto/v1', { profileImgUrl, xStart, yStart, xEnd, yEnd }, { token });
}

function userStatsV1(token: string) {
  return reqHelper('GET', '/user/stats/v1', {}, { token });
}
function usersStatsV1(token: string) {
  return reqHelper('GET', '/users/stats/v1', {}, { token });
}

function channelJoinV2(token : string, channelId : number) {
  return reqHelper('POST', '/channel/join/v2', { token, channelId });
}

function channelInviteV2(token : string, channelId : number, uId : number) {
  return reqHelper('POST', '/channel/invite/v2', { token, channelId, uId });
}

function channelLeaveV1(token : string, channelId : number) {
  return reqHelper('POST', '/channel/leave/v1', { token, channelId });
}

function channelsCreateV2(token : string, name: string, isPublic : boolean) {
  return reqHelper('POST', '/channels/create/v2', { name, isPublic }, { token });
}

function messageSendV1(token: string, channelId: number, message: string) {
  return reqHelper('POST', '/message/send/v1', { token, channelId, message });
}

function messageRemoveV1(token: string, messageId: number) {
  return reqHelper('DELETE', '/message/remove/v1', { token, messageId });
}

// ============================================================================

describe('userProfileUploadPhoto', () => {
  afterEach(() => {
    clearV1();
  });

  test('Invalid input bounds', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const statusCode = userProfileUploadPhoto(user.token, 'http://i.pinimg.com/originals/88/70/9f/88709f68a6e2db5892c25d637a0ba629.jpg', 3000, 3000, 40000, 40000);
    expect(statusCode).toEqual(400);
  });

  test('Invalid token', () => {
    const statusCode = userProfileUploadPhoto('lol', 'http://i.pinimg.com/originals/88/70/9f/88709f68a6e2db5892c25d637a0ba629.jpg', 0, 0, 300, 300);
    expect(statusCode).toEqual(403);
  });

  test('non-JPG image', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const statusCode = userProfileUploadPhoto(user.token, 'http://static.wikia.nocookie.net/reborn/images/f/fb/Natsu.PNG/revision/latest?cb=20100724061027', 0, 0, 500, 500);
    expect(statusCode).toEqual(400);
  });

  test('success case', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const result = userProfileUploadPhoto(user.token, 'http://i.pinimg.com/originals/88/70/9f/88709f68a6e2db5892c25d637a0ba629.jpg', 0, 0, 500, 500);
    expect(result).toEqual({});
  });
});

describe('userStatsV1 tests', () => {
  afterEach(() => {
    clearV1();
  });

  test('Initial configuration of usersStats', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');

    expect(userStatsV1(user.token)).toEqual({
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.anything() }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.anything() }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.anything() }],
        involvementRate: 0
      }
    });
  });

  test('Single Update of usersStats', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    channelsCreateV2(user.token, 'kevin', true);

    // const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');

    expect(userStatsV1(user.token)).toEqual({
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.anything() }, { numChannelsJoined: 1, timeStamp: expect.anything() }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.anything() }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.anything() }],
        involvementRate: 1
      }
    });
  });

  test('If there are multiple users', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');

    expect(userStatsV1(user.token)).toEqual({
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.anything() }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.anything() }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.anything() }],
        involvementRate: 0
      }
    });
  });

  test('If there are multiple stat increases', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'password3', 'random', 'person');

    const cId : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(user2.token, 'kevin', true);
    const cId2 : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(user3.token, 'Dylan', true);
    channelJoinV2(user.token, cId.channelId);
    channelInviteV2(user3.token, cId2.channelId, user.authUserId);
    const dmId = dmCreateV1(user.token, [user2.authUserId]);
    messageSendDmV1(user.token, dmId.dmID, ':)');
    messageSendV1(user.token, cId.channelId, ':)');

    expect(userStatsV1(user.token)).toEqual({
      userStats: {
        channelsJoined: [
          { numChannelsJoined: 0, timeStamp: expect.anything() },
          { numChannelsJoined: 1, timeStamp: expect.anything() },
          { numChannelsJoined: 2, timeStamp: expect.anything() }
        ],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.anything() },
          { numDmsJoined: 1, timeStamp: expect.anything() }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.anything() },
          { numMessagesSent: 1, timeStamp: expect.anything() },
          { numMessagesSent: 2, timeStamp: expect.anything() }],
        involvementRate: 1
      }
    });
  });
  test('If there are multiple stat decreases', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'password3', 'random', 'person');

    const cId : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(user2.token, 'kevin', true);
    const cId2 : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(user3.token, 'Dylan', true);
    channelJoinV2(user.token, cId.channelId);
    channelInviteV2(user3.token, cId2.channelId, user.authUserId);
    const dmId = dmCreateV1(user.token, [user2.authUserId]);
    channelLeaveV1(user.token, cId.channelId);
    dmRemoveV1(user.token, dmId.dmID);

    expect(userStatsV1(user.token)).toEqual({
      userStats: {
        channelsJoined: [
          { numChannelsJoined: 0, timeStamp: expect.anything() },
          { numChannelsJoined: 1, timeStamp: expect.anything() },
          { numChannelsJoined: 2, timeStamp: expect.anything() },
          { numChannelsJoined: 1, timeStamp: expect.anything() }
        ],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.anything() },
          { numDmsJoined: 1, timeStamp: expect.anything() },
          { numDmsJoined: 0, timeStamp: expect.anything() }
        ],
        messagesSent: [{ numMessagesSent: 0, timeStamp: expect.anything() }],
        involvementRate: 1 / 3
      }
    });
  });
});

describe('usersStatsV1 tests', () => {
  afterEach(() => {
    clearV1();
  });

  test('Initial configuration of workspaceStats', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    // const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    expect(usersStatsV1(user.token)).toEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.anything() }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.anything() }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.anything() }],
        utilizationRate: 0
      }
    });
  });

  test('Single update of workspaceStats', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    channelsCreateV2(user.token, 'kevin', true);
    expect(usersStatsV1(user.token)).toEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.anything() }, { numChannelsExist: 1, timeStamp: expect.anything() }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.anything() }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.anything() }],
        utilizationRate: 1
      }
    });
  });

  test('Multiple stat increases', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const cId : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(user.token, 'kevin', true);
    channelsCreateV2(user2.token, 'Dylan', false);
    const dmId = dmCreateV1(user.token, [user2.authUserId]);
    dmCreateV1(user2.token, [user.authUserId]);
    messageSendDmV1(user.token, dmId.dmID, ':)');
    messageSendV1(user.token, cId.channelId, ':)');

    expect(usersStatsV1(user.token)).toEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.anything() },
          { numChannelsExist: 1, timeStamp: expect.anything() },
          { numChannelsExist: 2, timeStamp: expect.anything() }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.anything() },
          { numDmsExist: 1, timeStamp: expect.anything() },
          { numDmsExist: 2, timeStamp: expect.anything() }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.anything() },
          { numMessagesExist: 1, timeStamp: expect.anything() },
          { numMessagesExist: 2, timeStamp: expect.anything() }],
        utilizationRate: 1
      }
    });
  });

  test('Multiple stat decreases', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const cId : ReturnChannelCreate | ErrorChannelCreate = channelsCreateV2(user.token, 'kevin', true);
    const dmId = dmCreateV1(user.token, [user2.authUserId]);
    messageSendDmV1(user.token, dmId.dmID, ':)');
    const mId2 : ReturnMessageSend | ErrorMessageSend = messageSendV1(user.token, cId.channelId, ':)');
    const result = messageRemoveV1(user.token, mId2.messageId);
    console.log(result);

    expect(usersStatsV1(user.token)).toEqual({
      workspaceStats: {
        channelsExist: [{ numChannelsExist: 0, timeStamp: expect.anything() }, { numChannelsExist: 1, timeStamp: expect.anything() }],
        dmsExist: [{ numDmsExist: 0, timeStamp: expect.anything() }, { numDmsExist: 1, timeStamp: expect.anything() }],
        messagesExist: [{ numMessagesExist: 0, timeStamp: expect.anything() },
          { numMessagesExist: 1, timeStamp: expect.anything() },
          { numMessagesExist: 2, timeStamp: expect.anything() },
          { numMessagesExist: 1, timeStamp: expect.anything() }
        ],
        utilizationRate: 1
      }
    });
  });
});
