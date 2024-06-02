import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/products';
const MONGO_DB = process.env.MONGO_DB || 'products';


export default class DB {
    /** Connect to MongoDB and open client */
    connect() {
        return MongoClient.connect(MONGO_URI)
            .then((_client) => {
                this.client = _client;
                this.db = this.client.db(MONGO_DB);
                this.collection = this.db.collection('products');
                console.log("Connected to MongoDB");
            })
    }

    /** Close client connection to MongoDB 
     * @returns {Promise} - Promise that resolves when connection is closed
    */
    close() {
        return this.client.close()
    }

    /** Query all products from database
     * @returns {Promise} - Promise that resolves to an array of products
     */
    queryAll() {
        return this.collection.find().toArray();
    }

    /** Query a single product by id
     * @param {string} id - id of product to query
     * @returns {Promise} - Promise that resolves to a product object 
     */
    queryById(id) {
        // TODO: Implement query by id
    }

    /** Update product by id
     * @param {string} id - id of product to update
     * @returns {Promise} - Promise with updated product
     */
    update(id, product) {
        //TODO: Implement update
    }

    /** Delete product by id
     * @param {string} id - id of product to delete
     * @returns {Promise} - Promise with deleted product
     */
    delete(id) {
        // TODO: Implement delete
    }

    /** Insert product
     * @param {object} product - product to insert
     * @returns {Promise} - Promise with inserted product
     */
    insert(product) {
        // TODO: Implement insert
    }
}