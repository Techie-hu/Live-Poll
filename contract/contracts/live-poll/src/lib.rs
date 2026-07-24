#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, vec, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub struct PollOption {
    pub text: String,
    pub votes: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Poll {
    pub question: String,
    pub options: Vec<PollOption>,
}

#[contracttype]
#[derive(Clone)]
pub struct Results {
    pub question: String,
    pub options: Vec<(String, u32)>,
}

const POLL: Symbol = symbol_short!("POLL");
const VOTED: Symbol = symbol_short!("VOTED");
const VOTE_0: Symbol = symbol_short!("VOTE_0");
const VOTE_1: Symbol = symbol_short!("VOTE_1");
const VOTE_2: Symbol = symbol_short!("VOTE_2");
const VOTE_3: Symbol = symbol_short!("VOTE_3");
const VOTE_4: Symbol = symbol_short!("VOTE_4");
const VOTE_5: Symbol = symbol_short!("VOTE_5");
const VOTE_6: Symbol = symbol_short!("VOTE_6");
const VOTE_7: Symbol = symbol_short!("VOTE_7");
const VOTE_8: Symbol = symbol_short!("VOTE_8");
const VOTE_9: Symbol = symbol_short!("VOTE_9");

fn vote_key(idx: u32) -> Symbol {
    match idx {
        0 => VOTE_0,
        1 => VOTE_1,
        2 => VOTE_2,
        3 => VOTE_3,
        4 => VOTE_4,
        5 => VOTE_5,
        6 => VOTE_6,
        7 => VOTE_7,
        8 => VOTE_8,
        9 => VOTE_9,
        _ => panic!("invalid option"),
    }
}

#[contract]
pub struct LivePoll;

#[contractimpl]
impl LivePoll {
    pub fn initialize(env: Env, question: String, options: Vec<String>) {
        if options.len() < 2 {
            panic!("at least 2 options required");
        }
        if options.len() > 10 {
            panic!("max 10 options allowed");
        }

        let mut poll_options = Vec::new(&env);
        for option_text in options.iter() {
            poll_options.push_back(PollOption {
                text: option_text,
                votes: 0,
            });
        }

        let poll = Poll {
            question,
            options: poll_options,
        };

        env.storage().persistent().set(&POLL, &poll);
    }

    pub fn vote(env: Env, voter: Address, option_index: u32) {
        voter.require_auth();

        let voted: Vec<Address> = env.storage().persistent().get(&VOTED).unwrap_or(vec![&env]);

        for v in voted.iter() {
            if v == voter {
                panic!("already voted");
            }
        }

        let poll: Poll = env.storage().persistent().get(&POLL).expect("poll not initialized");
        let idx = option_index;

        if idx >= poll.options.len() as u32 {
            panic!("invalid option");
        }

        let key = vote_key(idx);
        let current_votes: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(current_votes + 1));

        let voter_clone = voter.clone();
        let mut voted = voted;
        voted.push_back(voter_clone);
        env.storage().persistent().set(&VOTED, &voted);

        env.events().publish(
            (symbol_short!("vote_cast"), voter, idx),
            current_votes + 1,
        );
    }

    pub fn get_results(env: Env) -> Results {
        let poll: Poll = env.storage().persistent().get(&POLL).expect("poll not initialized");
        let mut results = Vec::new(&env);
        for i in 0..poll.options.len() {
            let key = vote_key(i as u32);
            let votes: u32 = env.storage().persistent().get(&key).unwrap_or(0);
            let option = poll.options.get(i as u32).expect("invalid option");
            results.push_back((option.text, votes));
        }
        Results {
            question: poll.question,
            options: results,
        }
    }
}

mod test;
