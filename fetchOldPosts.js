const nearAPI = require("near-api-js");
const fs = require("fs/promises");

const { keyStores, KeyPair } = nearAPI;
const myKeyStore = new keyStores.InMemoryKeyStore();

const { connect } = nearAPI;

const connectionConfig = {
    networkId: "mainnet",
    keyStore: myKeyStore, // first create a key store
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://wallet.mainnet.near.org",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://explorer.mainnet.near.org",
};

async function main() {
    const nearConnection = await connect(connectionConfig);
    const account = await nearConnection.account("devgovgigs.near");

    const contract = new nearAPI.Contract(account, "devgovgigs.near", {
        viewMethods: ["get_post", "get_parent_id"], // your smart-contract has a function `my_smart_contract_function`
    });

    // missing old posts that were not created by add_post
    let ids = [...Array(55).keys()];
    ids.push(60);

    let posts = await Promise.all(ids.map(id => contract.get_post({post_id: id})))
    let post_parents = await Promise.all(ids.map(id => contract.get_parent_id({post_id: id})))
    posts = posts.map((post, i) => ({...post, parent_id: post_parents[i]}))
    await fs.writeFile("oldPosts.json", JSON.stringify(posts, null, 2))
}

main()