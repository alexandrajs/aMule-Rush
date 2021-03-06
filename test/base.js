/* global describe, it */
"use strict";
/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
const AMule = require("amule");
const Rush = require("../");
const Redis = require("ioredis");
const redisClient = new Redis({db: 2});
const redisClient2 = new Redis({db: 3});
const assert = require("assert");
describe("Base", () => {
	after(() => {
		redisClient.disconnect();
		redisClient2.disconnect();
	});
	describe("AMule", () => {
		beforeEach((done) => {
			redisClient.flushdb(() => {
				redisClient2.flushdb(() => {
					done();
				});
			});
		});
		it("has", (done) => {
			let mule = new AMule();
			mule.use(new Rush({client: redisClient}));
			mule.has("key", "field", function (err, has) {
				assert.strictEqual(err, null);
				assert.strictEqual(has, false);
				mule.set("key", "field", "value", (err) => {
					assert.strictEqual(err, null);
					mule.has("key", "field", function (err, has) {
						assert.strictEqual(err, null);
						assert.strictEqual(has, true);
						done();
					});
				});
			});
		});
		it("set", (done) => {
			let mule = new AMule();
			mule.use(new Rush({client: redisClient}));
			mule.set("key", "field", "value", (err) => {
				assert.strictEqual(err, null);
				mule.has("key", "field", (err, has) => {
					assert.strictEqual(err, null);
					assert.strictEqual(has, true);
					done();
				});
			});
		});
		it("get", (done) => {
			let mule = new AMule();
			mule.use(new Rush({client: redisClient}));
			mule.get("key", "field", function (err, value) {
				assert.strictEqual(err, null);
				assert.strictEqual(value, null);
				mule.set("key", "field", "value", (err) => {
					assert.strictEqual(err, null);
					mule.get("key", "field", function (err, val) {
						assert.strictEqual(err, null);
						assert.strictEqual(val, "value");
						done();
					});
				});
			});
		});
		it("delete", (done) => {
			let mule = new AMule();
			mule.use(new Rush({client: redisClient}));
			mule.set("key", "field", "value", (err) => {
				assert.strictEqual(err, null);
				mule.has("key", "field", (err, has) => {
					assert.strictEqual(err, null);
					assert.strictEqual(has, true);
					mule.delete("key", "field", function (err) {
						assert.strictEqual(err, null);
						mule.has("key", "field", (err, has) => {
							assert.strictEqual(err, null);
							assert.strictEqual(has, false);
							done();
						});
					});
				});
			});
		});
		it("clear", (done) => {
			let mule = new AMule();
			mule.use(new Rush({client: redisClient}));
			mule.set("key", "field", "value", (err) => {
				assert.strictEqual(err, null);
				mule.has("key", "field", (err, has) => {
					assert.strictEqual(err, null);
					assert.strictEqual(has, true);
					mule.clear(function (err) {
						assert.strictEqual(err, null);
						mule.has("key", "field", (err, has) => {
							assert.strictEqual(err, null);
							assert.strictEqual(has, false);
							done();
						});
					});
				});
			});
		});
		it("stats", (done) => {
			let mule = new AMule();
			const rush = new Rush({client: redisClient});
			mule.use(rush);
			mule.get("key", "field", function (err, value) {
				assert.strictEqual(err, null);
				assert.strictEqual(value, null);
				const stats = rush.getStats();
				assert.strictEqual(stats.misses, 1);
				assert.strictEqual(stats.ratio, 0);
				assert.strictEqual(stats.hits, 0);
				mule.set("key", "field", "value", (err) => {
					assert.strictEqual(err, null);
					mule.get("key", "field", function (err, val) {
						assert.strictEqual(err, null);
						assert.strictEqual(val, "value");
						let stats = rush.getStats(true);
						assert.strictEqual(stats.misses, 1);
						assert.strictEqual(stats.ratio, 0.5);
						assert.strictEqual(stats.hits, 1);
						stats = rush.getStats();
						assert.strictEqual(stats.misses, 0);
						assert(Number.isNaN(stats.ratio));
						assert.strictEqual(stats.hits, 0);
						done();
					});
				});
			});
		});
	});
	describe("AMule 2 levels", () => {
		beforeEach((done) => {
			redisClient.flushdb(() => {
				redisClient2.flushdb(() => {
					done();
				});
			});
		});
		it("has", (done) => {
			const mule = new AMule(), rush1 = new Rush({client: redisClient}), rush2 = new Rush({client: redisClient2});
			mule.use(rush1);
			mule.use(rush2);
			rush2.has("key", "field", function (err, has) {
				assert.strictEqual(err, null);
				assert.strictEqual(has, false);
				mule.set("key", "field", "value", (err) => {
					assert.strictEqual(err, null);
					rush2.has("key", "field", function (err, has) {
						assert.strictEqual(err, null);
						assert.strictEqual(has, true);
						done();
					});
				});
			});
		});
		it("set", (done) => {
			const mule = new AMule(), rush1 = new Rush({client: redisClient}), rush2 = new Rush({client: redisClient2});
			mule.use(rush1);
			mule.use(rush2);
			mule.set("key", "field", "value", (err) => {
				assert.strictEqual(err, null);
				rush2.has("key", "field", (err, has) => {
					assert.strictEqual(err, null);
					assert.strictEqual(has, true);
					done();
				});
			});
		});
		it("get", (done) => {
			const mule = new AMule(), rush1 = new Rush({client: redisClient}), rush2 = new Rush({client: redisClient2});
			mule.use(rush1);
			mule.use(rush2);
			rush2.get("key", "field", function (err, value) {
				assert.strictEqual(err, null);
				assert.strictEqual(value, null);
				rush2.set("key", "field", "value", (err) => {
					assert.strictEqual(err, null);
					mule.get("key", "field", function (err, val) {
						assert.strictEqual(err, null);
						assert.strictEqual(val, "value");
					});
					mule.get("key", "field", function (err, val) {
						assert.strictEqual(err, null);
						assert.strictEqual(val, "value");
						done();
					});
				});
			});
		});
		it("delete", (done) => {
			const mule = new AMule(), rush1 = new Rush({client: redisClient}), rush2 = new Rush({client: redisClient2});
			mule.use(rush1);
			mule.use(rush2);
			mule.set("key", "field", "value", (err) => {
				assert.strictEqual(err, null);
				rush2.has("key", "field", (err, has) => {
					assert.strictEqual(err, null);
					assert.strictEqual(has, true);
					mule.delete("key", "field", function (err) {
						assert.strictEqual(err, null);
						rush2.has("key", "field", (err, has) => {
							assert.strictEqual(err, null);
							assert.strictEqual(has, false);
							done();
						});
					});
				});
			});
		});
		it("clear", (done) => {
			const mule = new AMule(), rush1 = new Rush({client: redisClient}), rush2 = new Rush({client: redisClient2});
			mule.use(rush1);
			mule.use(rush2);
			mule.set("key", "field", "value", (err) => {
				assert.strictEqual(err, null);
				rush2.has("key", "field", (err, has) => {
					assert.strictEqual(err, null);
					assert.strictEqual(has, true);
					mule.clear(function (err) {
						assert.strictEqual(err, null);
						rush2.has("key", "field", (err, has) => {
							assert.strictEqual(err, null);
							assert.strictEqual(has, false);
							done();
						});
					});
				});
			});
		});
	});
});
