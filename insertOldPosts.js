const queryApiAccount = "bo_near";
const indexer = "devhub_v36";

const prefix = queryApiAccount + "_" + indexer;

const fetch = require("node-fetch");


async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    "https://near-queryapi.api.pagoda.co/v1/graphql",
    {
      method: "POST",
      headers: {'Content-Type': 'application/json', 'x-hasura-role': queryApiAccount},
      body: JSON.stringify({
        query: operationsDoc,
        variables: variables,
        operationName: operationName
      })
    }
  );

  return await result.json();
}

const operationsDoc = `
mutation MyMutation($posts: [${prefix}_posts_insert_input!] = {}, $snapshots: [${prefix}_post_snapshots_insert_input!] = {}, $likes: [${prefix}_likes_insert_input!] = {}) {
    insert_${prefix}_posts(
      objects: $posts
      on_conflict: {constraint: posts_pkey}
    ) {
      returning {
        id
      }
    }
    insert_${prefix}_post_snapshots(
      objects: $snapshots
      on_conflict: {constraint: post_snapshots_pkey}
    ) {
      returning {
        post_id
        block_height
      }
    }
    insert_${prefix}_likes(
      objects: $likes
      on_conflict: {constraint: likes_pkey}
    ) {
      returning {
        author_id
        post_id
      }
    }
  }
  
`;

async function main() {
    const oldPosts = require('./oldPosts.json')
    const posts = oldPosts.map((post) => ({author_id: post.author_id, id: post.id, parent_id: post.parent_id}));
    const snapshots = oldPosts.flatMap(post => [post.snapshot, ...post.snapshot_history].map(snapshot => ({
        post_id: post.id,
        ts: snapshot.timestamp,
        editor_id: snapshot.editor_id,
        labels: snapshot.labels,
        post_type: snapshot.post_type,
        description: snapshot.description,
        name: snapshot.name,
        sponsorship_token: snapshot.sponsorship_token,
        sponsorship_amount: snapshot.amount,
        sponsorship_supervisor: snapshot.supervisor,
    })));
    const likes = oldPosts.flatMap(post => post.likes.map(like => ({author_id: like.author_id, post_id: post.id, ts: like.timestamp})));

    const { errors, data } = await fetchGraphQL(
        operationsDoc,
        "MyMutation",
        {posts, snapshots, likes}
    );
    if (errors) {
      console.error(errors);
    }
    console.log(JSON.stringify(data, null, 2));
}

main()