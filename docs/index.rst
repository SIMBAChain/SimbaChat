.. figure:: Simba-NS.png
   :align:   center
   
******************
SIMBA Chat
******************

==============

* Not yet written


Using SIMBA Chain


==============

`Here <https://www.youtube.com/watch?v=1BatYaRD60c&list=PLgfX2jfDfJNMEqF_xjZBYmavONXeRK_q5>`_ is a playlist on the SIMBA Chain Youtube channel to get you up to speed on using the dashboard.

.. _contract:
Smart Contract
************

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



.. _dashboard:
Creating an app on the SIMBA Dashboard
***************
Before Starting make sure you have an account on the Simba Dashboard and an Ethereum wallet with Ether in it on the Circle of life network

* Create The Smart Contract
* Create The Application
* Configure The Application(Ethereum Blockchain, Circle of Life, IPFS Filesystem, Permission disabled)
* Generate API Key(This is not the API name)
.. figure:: APIKey.png
   :align:   center
Converting the SimbaChat example to your app
***************
*Not yet written
