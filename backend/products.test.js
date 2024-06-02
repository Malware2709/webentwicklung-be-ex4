import request from 'supertest';
import { ObjectId } from 'mongodb';
import { app, server, db } from './index';

beforeAll(async () => {

    let { default: products } = await import('./products.json');
    // convert string ids to ObjectIds
    products = products.map(c => {
        c['_id'] = new ObjectId(c['_id']['$oid']);
        return c;
    });
    // restore sample products in db    
    await products.forEach(c => {
        db.collection
            .replaceOne({ _id: c['_id'] }, c, { upsert: true })
            .then(result => {
                console.log("updated customer %s", c.firstName);
            })
    });

});

afterAll(async () => {
    await server.close()
    await db.close()
});


