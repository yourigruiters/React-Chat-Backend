import chai from "chai";
import chaiHttp from "chai-http";

const expect = chai.expect;

chai.use(chaiHttp);

const io = require("socket.io-client");

describe("Suite of unit tests", function () {
  let socket: any;

  beforeEach(function (done) {
    // Setup
    socket = io.connect("http://localhost:5000", {
      "reconnection delay": 0,
      "reopen delay": 0,
      "force new connection": true
    });
    socket.on("connect", function () {
      console.log("connected...");
      done();
    });
    socket.on("disconnect", function () {
      console.log("disconnected...");
    });
  });

  afterEach(function (done) {
    // Cleanup
    if (socket.connected) {
      socket.disconnect();
    }
    done();
  });

  // Test if connection is set
  describe("Connection with socket", function () {
    it("Connection works", function (done) {
      socket.on("connection", (socket: any) => {
        expect(socket).to.not.be.null;
      });

      done();
    });
  });

  // Simple test for Hello World - First socket unit test
  describe("Socket - testing hello world", function () {
    it("should communicate", (done) => {
      socket.emit("echo", "Hello World");

      socket.once("echo", (message: string) => {
        // Check that the message matches
        expect(message).to.equal("Hello World");
        done();
      });
    });
  });

  // Joining a chatroom and receiving chatroom data
  describe("Socket - Joining a chatroom", function () {
    it("shoud receive data", (done) => {
      socket.emit("join_chatroom");

      socket.once(
        "new_roomdata",
        (roomData: { onlineUsers: string[]; typingUsers: string[] }) => {
          expect(roomData).to.have.property("typingUsers").with.lengthOf(0);
          done();
        }
      );
    });
  });

  // Joining a chatroom and receiving chatroom data
  describe("Socket - Leaving a chatroom", function () {
    it("shoud receive leave_activity", (done) => {
      socket.emit("leave_chatroom");

      socket.once("leave_inactivity", () => {
        done();
      });
    });
  });
});
