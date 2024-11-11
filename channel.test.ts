// import { channelsCreateV2 } from './channels';
// import { authRegisterV2 } from './auth';
// import { clearV1 } from './other';
import {
  ReturnAuthRegister,
  ErrorAuthRegister,
  ReturnChannelCreate,
  ErrorChannelCreate,
  ReturnChannelList,
  ErrorChannelList
} from './helper';
import request from 'sync-request';
import { url, port } from './config.json';

/*
// Self-tests for the 'authRegisterV2' function.
describe('channelsCreateV2 tests', () => {
  afterEach(() => {
    clearV1();
  });

  // test('Deals with multiple valid entries', () => {
  //   const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
  //   channelsCreateV2(person1.token, 'sampleChannel', true);

  //   const person2 = authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
  //   expect(channelsCreateV2(person2.token, 'TeosChannel', false)).toStrictEqual({ channelId: 2 });
  // });

  // test('HTTP Deals with multiple valid entries', () => {
  //   const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
  //   request(
  //     'POST',
  //     SERVER_URL + '/channels/create/v2',
  //     {
  //       body: JSON.stringify({ token: person1.token, name: 'sampleChannel', isPublic: true }),
  //       headers: { 'Content-type': 'application/json' }
  //     }
  //   );
  //   const person2 = authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
  //   const res = request(
  //     'POST',
  //     SERVER_URL + '/channels/create/v2',
  //     {
  //       body: JSON.stringify({ token: person2.token, name: 'TeosChannel', isPublic: false }),
  //       headers: { 'Content-type': 'application/json' }
  //     }
  //   );
  //   const data = JSON.parse(String(res.getBody()));
  //   expect(data).toStrictEqual({ channelId: 2 });
  // });

  test('Deals with too short channel names', () => {
    const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
    channelsCreateV2(person1.token, '', true);

    const person2 = authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
    expect(channelsCreateV2(person2.token, '', false)).toStrictEqual({ error: 'error' });
  });

  test('HTTP Deals with too short channel names', () => {
    const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
    const res = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify({ token: person1.token, name: '', isPublic: true }),
        headers: { 'Content-type': 'application/json' }
      }
    );
    const data = JSON.parse(String(res.getBody()));
    expect(data).toStrictEqual({ error: 'error' });
  });

  test('Deals with too long channel names', () => {
    const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
    channelsCreateV2(person1.token, 'thisstringshouldhaveoverfiftyflippincharactersificountedcorrectly!!!', true);

    const person2 = authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
    expect(channelsCreateV2(person2.token, 'thisstringshouldhaveoverfiftyflippincharactersificountedcorrectlyBUTactuallyitsprobablyEVENMOREEEEEE', false)).toStrictEqual({ error: 'error' });
  });

  test('HTTP Deals with too long channel names', () => {
    const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
    channelsCreateV2(person1.token, 'thisstringshouldhaveoverfiftyflippincharactersificountedcorrectly!!!', true);

    const person2 = authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
    const res = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify({ token: person2.token, name: 'thisstringshouldhaveoverfiftyflippincharactersificountedcorrectlyBUTactuallyitsprobablyEVENMOREEEEEE', isPublic: false }),
        headers: { 'Content-type': 'application/json' }
      }
    );
    const data = JSON.parse(String(res.getBody()));
    expect(data).toStrictEqual({ error: 'error' });
  });

  test('Deals with multiple valid channels with same name', () => {
    const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
    channelsCreateV2(person1.token, 'Cookies', true);

    const person2 = authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
    expect(channelsCreateV2(person2.token, 'Cookies', false)).toStrictEqual({ channelId: 2 });
  });

  test('HTTP Deals with too long channel names', () => {
    const person1 = JSON.parse(String(request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify({ email: 'edwardroy@gmail.com', password: 'password1', nameFirst: 'Edward', nameLast: 'Roy' }),
        headers: { 'Content-type': 'application/json' }
      }
    ).getBody()));

    request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify({ token: person1.token, name: 'Cookies', isPublic: false }),
        headers: { 'Content-type': 'application/json' }
      }
    );

    const person2 = JSON.parse(String(request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify({ email: 'edwardroy1@gmail.com', password: 'password1', nameFirst: 'Edward', nameLast: 'Roy' }),
        headers: { 'Content-type': 'application/json' }
      }
    ).getBody()));

    const res = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify({ token: person2.token, name: 'Cookies', isPublic: false }),
        headers: { 'Content-type': 'application/json' }
      }
    );
    const data = JSON.parse(String(res.getBody()));
    expect(data).toStrictEqual({ channelId: 2 });
  });

  test('Deals with invalid authUserId', () => {
    const person1 = authRegisterV2('edwardroy@gmail.com', 'Password1', 'Edward', 'Roy');
    channelsCreateV2(person1.token, 'Cookies', true);

    authRegisterV2('teo@gmail.com', 'teopassword', 'Teo', 'Mateo');
    expect(channelsCreateV2('bababooey', 'Cookies', false)).toStrictEqual({ error: 'error' });
  });
});
*/
describe('channelsListV3 http tests', () => {
  const SERVER_URL = `${url}:${port}`;

  afterEach(() => {
    request(
      'DELETE',
      SERVER_URL + '/clear/v1',
      { qs: {} });
  });

  test('testing for multiple channels', () => {
    const res1 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: '04kevinlin@gmail.com',
            password: 'password',
            nameFirst: 'Kevin',
            nameLast: 'Lin'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res1.getBody() as string);

    const res2 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'shu',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user.token}`
        }
      }
    );

    const cId1 : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res2.getBody() as string);

    const res3 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'bing',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: user.token
        }
      }
    );

    const cId2 : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res3.getBody() as string);

    const res4 = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        qs: {},
        headers: { token: user.token }
      }
    );

    const test : ReturnChannelList | ErrorChannelList = JSON.parse(res4.getBody() as string);

    expect(test).toEqual(
      {
        channels: [
          { channelId: cId1.channelId, name: 'shu' },
          { channelId: cId2.channelId, name: 'bing' }
        ]
      }
    );
  });

  test('testing that only channels the user is part of is returned', () => {
    const res1 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: '04kevinlin@gmail.com',
            password: 'password',
            nameFirst: 'Kevin',
            nameLast: 'Lin'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user1 : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res1.getBody() as string);

    const res2 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: 'edwardroy@gmail.com',
            password: 'password1',
            nameFirst: 'Edward',
            nameLast: 'Roy'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user2 : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res2.getBody() as string);

    const res3 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'shu',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user1.token}`
        }
      }
    );

    const cId : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res3.getBody() as string);

    request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'bing',
            isPublic: false,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user2.token}`
        }
      }
    );

    const res4 = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        qs: {},
        headers: { token: user1.token }
      }
    );

    const test : ReturnChannelList | ErrorChannelList = JSON.parse(res4.getBody() as string);

    expect(test).toEqual(
      {
        channels: [
          { channelId: cId.channelId, name: 'shu' },
        ]
      }
    );
  });

  test('testing if the auth user is not part of any channels', () => {
    const res1 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: '04kevinlin@gmail.com',
            password: 'password',
            nameFirst: 'Kevin',
            nameLast: 'Lin'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user1 : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res1.getBody() as string);

    const res2 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: 'edwardroy@gmail.com',
            password: 'password1',
            nameFirst: 'Edward',
            nameLast: 'Roy'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user2 : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res2.getBody() as string);

    request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'bing',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user2.token}`
        }
      }
    );

    const res4 = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        qs: {},
        headers: { token: user1.token }
      }
    );

    const test : ReturnChannelList | ErrorChannelList = JSON.parse(res4.getBody() as string);

    expect(test).toEqual({ channels: [] });
  });

  test('testing if an invalid token is inputted', () => {
    const res = request(
      'GET',
      SERVER_URL + '/channels/list/v3',
      {
        qs: {},
        headers: { token: '' }
      }
    );
    expect(res.statusCode).toEqual(403);
  });
});

describe('channelsListallV3 http tests', () => {
  afterEach(() => {
    request(
      'DELETE',
      SERVER_URL + '/clear/v1',
      { qs: {} });
  });
  const SERVER_URL = `${url}:${port}`;

  test('testing if there are no channels', () => {
    const res1 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: '04kevinlin@gmail.com',
            password: 'password',
            nameFirst: 'Kevin',
            nameLast: 'Lin'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res1.getBody() as string);

    const res2 = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        qs: {},
        headers: { token: user.token }
      }
    );

    const test : ReturnChannelList | ErrorChannelList = JSON.parse(res2.getBody() as string);

    expect(test).toEqual({ channels: [] });
  });

  test('testing for mulitple channels', () => {
    const res1 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: '04kevinlin@gmail.com',
            password: 'password',
            nameFirst: 'Kevin',
            nameLast: 'Lin'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res1.getBody() as string);

    const res2 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'shu',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user.token}`
        }
      }
    );

    const cId1 : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res2.getBody() as string);

    const res3 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'bing',
            isPublic: false,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user.token}`
        }
      }
    );

    const cId2 : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res3.getBody() as string);

    const res4 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'qing',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user.token}`
        }
      }
    );

    const cId3 : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res4.getBody() as string);

    const res5 = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        qs: {},
        headers: { token: user.token }
      }
    );

    const test : ReturnChannelList | ErrorChannelList = JSON.parse(res5.getBody() as string);

    expect(test).toEqual(
      {
        channels: [
          { channelId: cId1.channelId, name: 'shu' },
          { channelId: cId2.channelId, name: 'bing' },
          { channelId: cId3.channelId, name: 'qing' },
        ]
      });
  });

  test('testing for a singular channel', () => {
    const res1 = request(
      'POST',
      SERVER_URL + '/auth/register/v2',
      {
        body: JSON.stringify(
          {
            email: '04kevinlin@gmail.com',
            password: 'password',
            nameFirst: 'Kevin',
            nameLast: 'Lin'
          }),
        headers: {
          'Content-type': 'application/json'
        }
      }
    );

    const user : ReturnAuthRegister | ErrorAuthRegister = JSON.parse(res1.getBody() as string);

    const res2 = request(
      'POST',
      SERVER_URL + '/channels/create/v2',
      {
        body: JSON.stringify(
          {
            name: 'shu',
            isPublic: true,
          }),
        headers: {
          'Content-type': 'application/json',
          token: `${user.token}`
        }
      }
    );

    const cId : ReturnChannelCreate | ErrorChannelCreate = JSON.parse(res2.getBody() as string);

    const res3 = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        qs: {},
        headers: { token: user.token }
      }
    );

    const test : ReturnChannelList | ErrorChannelList = JSON.parse(res3.getBody() as string);

    expect(test).toEqual(
      {
        channels: [
          { channelId: cId.channelId, name: 'shu' },
        ]
      }
    );
  });

  test('testing if an invalid token is inputted', () => {
    const res = request(
      'GET',
      SERVER_URL + '/channels/listall/v3',
      {
        qs: {},
        headers: { token: '' }
      }
    );

    expect(res.statusCode).toEqual(403);
  });
});
