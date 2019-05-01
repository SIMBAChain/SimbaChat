pragma solidity ^0.4.24;

contract Application {
    function Application() public {}
    enum Assets {
        chatRoom, message
    }
    Assets _message = Assets.chatRoom;
    Assets _createRoom = Assets.chatRoom;
    Assets _sendMessage = Assets.message;

    function message (
        string assetId)    /* parameter needed for linking assets and transactions */
    public {}

    function createRoom (
        string assetId, /* parameter needed for linking assets and transactions */
        string name, /* optional parameter */
        string createdBy)   /* optional parameter */
    public {}

    function sendMessage (
        string assetId, /* parameter needed for linking assets and transactions */
        string message, /* optional parameter */
        string sentBy, /* optional parameter */
        string chatRoom, /* optional parameter */
        string _bundleHash)   /* optional parameter */
    public {}
}
