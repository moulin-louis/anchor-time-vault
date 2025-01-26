use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct Vault {
    pub start_clock: i64,
    pub end_clock: i64,
    pub nbr_lamports: u64,
    pub bump: u8,
}

#[error_code]
pub enum CustomError {
    #[msg("Time Lock Not Reached")]
    NotReached,
}
