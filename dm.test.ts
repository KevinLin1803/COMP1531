import { ReturnAuthRegister, ErrorAuthRegister, ReturnDmCreate, ErrorDmCreate, MessagesReturn, ErrorMessagesReturn } from './helper';
import request, { HttpVerb } from 'sync-request';
import { url, port } from './config.json';

// ============================================================================
// HTTP Helper
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

function dmListV1(token: string) {
  return reqHelper('GET', '/dm/list/v1', {}, { token });
}

function dmRemoveV1(token: string, dmId: number) {
  return reqHelper('DELETE', '/dm/remove/v1', { dmId }, { token });
}

function dmDetailsV1(token: string, dmId: number) {
  return reqHelper('GET', '/dm/details/v1', { dmId }, { token });
}

function dmLeaveV1(token: string, dmId: number) {
  return reqHelper('POST', '/dm/leave/v1', { dmId }, { token });
}

function dmMessagesV1(token: string, dmId: number, start: number) {
  return reqHelper('GET', '/dm/messages/v1', { dmId, start }, { token });
}

function messageSendDmV1(token: string, dmId: number, message: string) {
  return reqHelper('POST', '/message/senddm/v1', { dmId, message }, { token });
}
// ============================================================================

describe('/dm/create/v1', () => {
  afterEach(() => {
    clearV1();
  });

  describe('errors', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'Dylan', 'Zi');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'Dylan', 'Wang');
    test.each([
      { token: '-1', uIds: [] },
      { token: `${user1.token}`, uIds: [-1, user2.authUserId] },
    ])("('$token', '$uIds')", ({ token, uIds }) => {
      const errorDmCreate = dmCreateV1(token, uIds);
      expect(errorDmCreate).toStrictEqual({ error: expect.any(String) });
    });
  });
  describe('success', () => {
    test('Sucess: user1 owner', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'Dylan', 'Zi');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'Dylan', 'Wang');
      const successDm = dmCreateV1(`${user1.token}`, [user2.authUserId]);
      expect(successDm).toStrictEqual({
        dmId: expect.any(Number)
      });
    });
    test('Sucess: user1 owner dming themself', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'Dylan', 'Zi');
      const successDm = dmCreateV1(`${user1.token}`, [user1.authUserId]);
      expect(successDm).toStrictEqual({
        dmId: expect.any(Number)
      });
    });
  });
});

describe('/dm/list/v1', () => {
  afterEach(() => {
    clearV1();
  });

  describe('Errors', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'aaa', 'bbb');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ccc', 'ddd');
    dmCreateV1(`${user1.token}`, [user2.authUserId]);
    test('Invalid token', () => {
      const errorDmList = dmListV1('-1');
      expect(errorDmList).toStrictEqual({ error: expect.any(String) });
    });
  });
  describe('Success', () => {
    test('Sucess: user1 in 1 channel only', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'eee', 'fff');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ggg', 'hhh');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'iii', 'jjj');
      dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      dmCreateV1(`${user2.token}`, [user3.authUserId]);
      const successDmList = dmListV1(`${user1.token}`);
      expect(successDmList).toStrictEqual({
        dms: [{
          dmId: expect.any(Number),
          name: 'eeefff, ggghhh, iiijjj'
        }]
      });
    });
    test('Sucess: user2 in 2 channels', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'eee', 'fff');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ggg', 'hhh');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'iii', 'jjj');
      dmCreateV1(`${user2.token}`, [user3.authUserId]);
      dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      const successDmList = dmListV1(`${user2.token}`);
      expect(successDmList).toStrictEqual({
        dms: [
          {
            dmId: expect.any(Number),
            name: 'eeefff, ggghhh, iiijjj'
          },
          {
            dmId: expect.any(Number),
            name: 'ggghhh, iiijjj'
          }]
      });
    });
  });
});

describe('/dm/remove/v1', () => {
  afterEach(() => {
    clearV1();
  });

  describe('errors', () => {
    test('Invalid token', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'aaa', 'bbb');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ccc', 'ddd');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'eee', 'fff');
      const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      const errorDmRemove = dmRemoveV1('-1', +dm.dmId);
      expect(errorDmRemove).toStrictEqual({ error: expect.any(String) });
    });
    test('Invalid dmId', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'aaa', 'bbb');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ccc', 'ddd');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'eee', 'fff');
      dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      const errorDmRemove = dmRemoveV1(`${user1.token}`, -1);
      expect(errorDmRemove).toStrictEqual({ error: expect.any(String) });
    });
    test('User not owner', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'aaa', 'bbb');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ccc', 'ddd');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'eee', 'fff');
      const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      const errorDmRemove = dmRemoveV1(`${user2.token}`, +dm.dmId);
      expect(errorDmRemove).toStrictEqual({ error: expect.any(String) });
    });
    test('User is owner, but left', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'aaa', 'bbb');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ccc', 'ddd');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'eee', 'fff');
      const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      const errorDmRemove = dmRemoveV1(`${user2.token}`, +dm.dmId);
      expect(errorDmRemove).toStrictEqual({ error: expect.any(String) });
    });
  });

  describe('success', () => {
    test('Sucess', () => {
      const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'HelloPass!123', 'eee', 'fff');
      const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'ggg', 'hhh');
      const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'iii', 'jjj');
      const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(`${user1.token}`, [user2.authUserId, user3.authUserId]);
      const successDmRemove = dmRemoveV1(`${user1.token}`, +dm.dmId);
      expect(successDmRemove).toStrictEqual({
      });
    });
  });
});

describe('tests for dmdetails', () => {
  afterEach(() => {
    clearV1();
  });

  test('Invalid token', () => {
    expect(dmDetailsV1('bahahhaahahah', 8)).toEqual(403);
  });

  test('Invalid dmId', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    expect(dmDetailsV1(String(user.token), 8)).toEqual(400);
  });

  test('dmId is valid but user is not part of dm ', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);
    const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'password3', 'Kelvin', 'Marhew');
    expect(dmDetailsV1(String(user3.token), dm.dmId)).toEqual(403);
  });

  test('Successful dm detail retrieval', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson1@gmail.com', 'HelloPass!123', 'Dylan', 'Wang');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson2@gmail.com', 'HelloPass!123', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(String(user1.token), [Number(user2.authUserId)]);
    expect(dmDetailsV1(String(user1.token), dm.dmId)).toEqual({
      name: expect.any(String),
      members: [
        {
          email: 'randomperson2@gmail.com',
          handleStr: 'kevinlin',
          nameFirst: 'Kevin',
          nameLast: 'Lin',
          uId: user2.authUserId,
        },
        {
          email: 'randomperson1@gmail.com',
          handleStr: 'dylanwang',
          nameFirst: 'Dylan',
          nameLast: 'Wang',
          uId: user1.authUserId,
        }
      ]
    });
  });
});

describe('tests for dmLeaveV1', () => {
  afterEach(() => {
    clearV1();
  });

  test('Invalid token', () => {
    expect(dmLeaveV1('bahahhaahahah', 8)).toEqual(403);
  });

  test('Invalid dmId', () => {
    const user : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    expect(dmLeaveV1(String(user.token), 8)).toEqual(400);
  });

  test('dmId is valid but user is not part of dm ', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);
    const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'password3', 'Kelvin', 'Marhew');
    expect(dmLeaveV1(String(user3.token), dm.dmId)).toEqual(403);
  });

  test('Successful dm leave', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);
    expect(dmLeaveV1(String(user1.token), dm.dmId)).toEqual({});
    expect(dmDetailsV1(String(user1.token), dm.dmId)).toEqual(403);
  });
});

describe('tests for dmMessagesV1', () => {
  afterEach(() => {
    clearV1();
  });

  test('Invalid token', () => {
    expect(dmMessagesV1('bahahhaahahah', 8, 0)).toEqual(403);
  });

  test('Invalid dmId', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    dmCreateV1(user1.token, [user2.authUserId]);
    expect(dmMessagesV1(String(user1.token), -1, 0)).toEqual(400);
  });

  test('dmId is valid but user is not part of dm ', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);
    const user3 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('randomperson@gmail.com', 'password3', 'Kelvin', 'Marhew');
    expect(dmMessagesV1(user3.token, dm.dmId, 0)).toEqual(403);
  });

  test('Successful dm message return of < 50', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);

    const messageId = [];

    for (let i = 0; i < 20; i++) {
      const Id = messageSendDmV1(user1.token, dm.dmId, 'Yallah habib');
      messageId.push(Id.messageId);
    }

    const test : MessagesReturn | ErrorMessagesReturn = dmMessagesV1(user1.token, dm.dmId, 0);

    for (let i = 0; i < 20; i++) {
      expect(test.messages[i]).toEqual({
        messageId: messageId[(messageId.length - 1 - i)],
        uId: user1.authUserId,
        message: 'Yallah habib',
        timeSent: expect.any(String),
        reacts: [],
        pinned: false
      });
    }
  });

  test('Successful dm message pagination', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);

    const messageId = [];

    for (let i = 0; i < 24; i++) {
      const Id = messageSendDmV1(user1.token, dm.dmId, 'Yallah habib');
      messageId.push(Id.messageId);
    }

    for (let i = 24; i < 74; i++) {
      const Id = messageSendDmV1(user1.token, dm.dmId, 'Wallah shu');
      messageId.push(Id.messageId);
    }

    for (let i = 74; i < 124; i++) {
      const Id = messageSendDmV1(user1.token, dm.dmId, 'yes broksi');
      messageId.push(Id.messageId);
    }

    const test1 : MessagesReturn | ErrorMessagesReturn = dmMessagesV1(user1.token, dm.dmId, 0);
    const test2 : MessagesReturn | ErrorMessagesReturn = dmMessagesV1(user1.token, dm.dmId, 50);
    const test3 : MessagesReturn | ErrorMessagesReturn = dmMessagesV1(user1.token, dm.dmId, 100);

    for (let i = 0; i < 50; i++) {
      expect(test1.messages[i]).toEqual({
        messageId: messageId[123 - i],
        uId: user1.authUserId,
        message: 'yes broksi',
        timeSent: expect.any(String),
        reacts: [],
        pinned: false
      });
    }
    expect(test1.start).toEqual(0);
    expect(test1.end).toEqual(50);

    for (let i = 0; i < 50; i++) {
      expect(test2.messages[i]).toEqual({
        messageId: messageId[73 - i],
        uId: user1.authUserId,
        message: 'Wallah shu',
        timeSent: expect.any(String),
        reacts: [],
        pinned: false
      });
    }

    expect(test2.start).toEqual(50);
    expect(test2.end).toEqual(100);

    for (let i = 0; 23 - i >= 0; i++) {
      expect(test3.messages[i]).toEqual({
        messageId: messageId[23 - i],
        uId: user1.authUserId,
        message: 'Yallah habib',
        timeSent: expect.any(String),
        reacts: [],
        pinned: false
      });
    }
    expect(test3.start).toEqual(100);
    expect(test3.end).toEqual(-1);
  });

  test('If start is greater than the number of messages', () => {
    const user1 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('edwardroy@gmail.com', 'password1', 'Edward', 'Roy');
    const user2 : ReturnAuthRegister | ErrorAuthRegister = authRegisterV2('04kevinlin@gmail.com', 'password2', 'Kevin', 'Lin');
    const dm : ReturnDmCreate | ErrorDmCreate = dmCreateV1(user1.token, [user2.authUserId]);

    for (let i = 0; i < 20; i++) {
      messageSendDmV1(user1.token, dm.dmId, 'Yallah habib');
    }

    expect(dmMessagesV1(user1.token, dm.dmId, 21)).toStrictEqual(400);
  });
});
