import chai from "chai";
import chaiHttp from "chai-http";
import server from "../server";

const should = chai.should();

chai.use(chaiHttp);

// Testing Express server elements
describe("Express - server running", () => {
  it("Server is running", (done) => {
    chai
      .request(server)
      .get("/")
      .end((err, result) => {
        result.should.have.status(200);
        done();
      });
  });
});

describe("Express - test for free username working", () => {
  it("Server is respondig with 200", (done) => {
    chai
      .request(server)
      .get("/api/user/free")
      .end((err, result) => {
        result.should.have.status(200);
        done();
      });
  });

  it("Server is respondig with 202", (done) => {
    chai
      .request(server)
      .get("/api/user/testtaken")
      .end((err, result) => {
        result.should.have.status(202);
        done();
      });
  });
});
