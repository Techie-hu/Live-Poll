#![cfg(test)]

use super::*;
use soroban_sdk::{vec, Env, String};

#[test]
fn test_live_poll() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LivePoll, ());
    let client = LivePollClient::new(&env, &contract_id);

    let question = String::from_str(&env, "What is your favorite language?");
    let options = vec![
        &env,
        String::from_str(&env, "Rust"),
        String::from_str(&env, "TypeScript"),
        String::from_str(&env, "Python"),
    ];

    client.initialize(&question, &options);

    let results = client.get_results();
    assert_eq!(results.question, question);

    let voter = Address::generate(&env);
    client.vote(&voter, &0);
    client.vote(&voter, &1);
    client.vote(&voter, &0);

    let results = client.get_results();
    assert_eq!(results.options.get(0).unwrap().1, 2);
    assert_eq!(results.options.get(1).unwrap().1, 1);
    assert_eq!(results.options.get(2).unwrap().1, 0);
}
