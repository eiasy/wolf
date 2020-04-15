
const mocha = require('./util/mocha')
const util = require('./util/util')

const headers = util.adminHeaders()

function getAddResponseSchema(values) {
  const applicationSchema = {
    type: "object",
    properties: {
        id: {"type":"string"},
        name: {"type":"string"},
        description: {"type":"string"},
        redirectUris: {"type":"array","items":{"type":"string"}},
        grants: {"type":"array","items":{"type":"string"}},
        accessTokenLifetime: {"type":"integer"},                                                                                                                                          refreshTokenLifetime: {"type":"integer"},
        createTime: {"type":"integer"},
        updateTime: {"type":"integer"}
    },
    required: ["id","name","description","redirectUris","grants","accessTokenLifetime","refreshTokenLifetime","createTime","updateTime"]
  }

  util.setDefaultOfSchema(applicationSchema, values, applicationSchema.required)
  const schema = util.okSchema({
    type: "object",
    properties: {
        application: applicationSchema
    },
    required: ["application"]
  })
  return schema
}

function getListResponseSchema() {
  const schema = util.okSchema({
    type: "object",
    properties: {
        applications: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: {"type":"string"},
                    name: {"type":"string"},
                    description: {"type":"string"},
                    createTime: {"type":"integer"},
                    updateTime: {"type":"integer"}
                },
                required: ["id","name","description","createTime","updateTime"]
            }
        },
        total: {"type":"integer"}
    },
    required: ["applications","total"]
  })
  return schema
}

// const application = null;

describe('application', function() {
  const id = 'test-application-id'
  const name = 'test-application-name'

  it('add', async function() {
    const description = 'application description'
    const secret = 'secret'
    const redirectUris = ['http://localhost/path']
    const grants = ['authorization_code', 'refresh_token']
    const accessTokenLifetime = 3600;
    const refreshTokenLifetime = 7200;
    const body = {id, name, description, secret, redirectUris, grants, accessTokenLifetime, refreshTokenLifetime}
    const schema = getAddResponseSchema(body);
    const url = '/wolf/application/add';
    await mocha.post({url, headers, body, schema})
  });

  it('update', async function() {
    const name = 'test-application-name:updated'
    const description = 'application description updated'
    const secret = 'secret2'
    const redirectUris = ['http://localhost/path2']
    const grants = ['authorization_code']
    const accessTokenLifetime = 3601
    const refreshTokenLifetime = 7201

    const body = {id, name, description, secret, redirectUris, grants, accessTokenLifetime, refreshTokenLifetime}
    const schema = getAddResponseSchema(body);

    const url = '/wolf/application/update';
    await mocha.post({url, headers, body, schema})
  });

  it('get ok', async function() {
    const schema = getAddResponseSchema();
    const args = {id}
    const url = '/wolf/application/get';
    await mocha.get({url, headers, args, schema})
  });

  it('get failed, not found', async function() {
    const schema = util.failSchema('ERR_OBJECT_NOT_FOUND')
    const args = {id: 'id-not-exist'}
    const url = '/wolf/application/get';
    await mocha.get({url, headers, args, schema})
  });

  it('get secret', async function(){
    const dataSchema = {
      type: "object",
      properties: {
        "secret":{
          "type":"string",
          "enum": ["secret2"]
        }
      },
      required: ["secret"]
    }
    const schema = util.okSchema(dataSchema);
    const args = {id}
    const url = '/wolf/application/secret'
    await mocha.get({url, headers, args, schema, showSchema: true})
  });

  it('get secret failed, not found', async function() {
    const schema = util.failSchema('ERR_OBJECT_NOT_FOUND')
    const args = {id: 'id-not-exist'}
    const url = '/wolf/application/secret';
    await mocha.get({url, headers, args, schema})
  });

  it('list', async function() {
    const schema = getListResponseSchema()
    const url = '/wolf/application/list'
    const args = {key: name}
    await mocha.get({url, headers, args, schema})
  });

  it('list all', async function() {
    const schema = getListResponseSchema()
    const url = '/wolf/application/list_all'
    const args = {}
    await mocha.get({url, headers, args, schema})
  });

  it('diagram', async function() {
    const schema = util.okSchema()
    const url = '/wolf/application/diagram'
    const args = {id}
    await mocha.get({url, headers, args, schema})
  });

  describe('admin access deny', function() {
    let userInfo = null;
    const headers = Object.assign({}, util.adminHeaders())
    const username = 'admin-user-001'
    const password = util.defPassword()

    it('add admin user', async function() {
      const schema = util.okSchema()
      const nickname = username
      const email = username + '@company.com'
      const tel = '13011002200'
      const appIDs = [id]
      const manager = 'admin'
      const body = {username, nickname, email, tel, appIDs, manager, password}
      const url = '/wolf/user/add';
      await mocha.post({url, headers: util.adminHeaders(), body, status: 200, schema})
    });
    it('admin login success', async function() {
      const schema = util.okSchema()
      const body = { username, password}
      const url = `/wolf/user/login`;
      const res = await mocha.post({url, headers, body, status: 200, schema})
      headers['x-rbac-token'] = res.body.data.token
    });

    it('delete application failed, access deny', async function() {
      const schema = util.failSchema('ERR_ACCESS_DENIED');
      const body = { id: 'id-not-exist' }
      const url = `/wolf/application/delete`;
      await mocha.post({url, headers, body, status: 401, schema})
    });


    it('get secret failed, access deny', async function() {
      const schema = util.failSchema('ERR_ACCESS_DENIED')
      const args = {id: 'id-not-exist'}
      const url = '/wolf/application/secret';
      await mocha.get({url, headers, args, status: 401, schema})
    });

    it('list', async function() {
      const schema = getListResponseSchema()
      const url = '/wolf/application/list'
      const args = {key: name}
      await mocha.get({url, headers, args, schema})
    });

    after(async function() {
      const schema = util.okSchema({type: 'object'});
      const body = {username}
      const url = '/wolf/user/delete';
      await mocha.post({url, headers: util.adminHeaders(), body, schema})
    });
  });

  after(async function() {
    const url = '/wolf/application/delete';
    const body = {id}
    await mocha.post({url, headers, body})
  });
});
