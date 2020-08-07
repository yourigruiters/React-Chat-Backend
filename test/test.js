import assert from "assert";
import chai from "chai";
import chaiHttp from "chai-http";
import server from "../server.ts";

const should = chai.should();

chai.use(chaiHttp);

// Seem to have an issue with using Typescript with Mocha testing
describe("Online server", () => {
  it("Server is online", (done) => {
    chai
      .request(server)
      .get("/")
      .end((err, result) => {
        result.should.have.status(200);
        done();
      });
  });
});
