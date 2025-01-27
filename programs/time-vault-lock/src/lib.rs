use anchor_lang::prelude::*;
use state::Vault;

mod state;

use state::CustomError;

declare_id!("4n8pDPEUzwXcTUmRrw61iTzfQssJBoxZWDusopTXN4hA");

#[program]
pub mod time_vault_lock {

    use anchor_lang::solana_program::system_instruction;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, end_clock: i64, nbr_lamports: u64) -> Result<()> {
        msg!(
            "start unix timestamp = {} seconds",
            Clock::get()?.unix_timestamp
        );
        msg!("end_lock = {} seconds", end_clock);

        let pda = &mut ctx.accounts.time_vault_pda;
        let user = &mut ctx.accounts.user;

        pda.start_clock = Clock::get()?.unix_timestamp;
        pda.end_clock = end_clock;
        pda.nbr_lamports = nbr_lamports;
        pda.bump = ctx.bumps.time_vault_pda;
        msg!("vault initialized",);

        msg!("locking {} lamports for {} ms", nbr_lamports, end_clock);
        let transfer_instruction = system_instruction::transfer(user.key, &pda.key(), nbr_lamports);
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_instruction,
            &[
                user.to_account_info(),
                pda.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;
        msg!(
            "transfered {} lamports from {} to {}",
            nbr_lamports,
            user.key,
            ctx.accounts.time_vault_pda.key()
        );
        msg!("end unix timestamp = {}", Clock::get()?.unix_timestamp);
        Ok(())
    }

    pub fn unlock(ctx: Context<Unlock>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        let pda = &mut ctx.accounts.time_vault_pda;

        let current_time = Clock::get()?.unix_timestamp;
        msg!("current time = {}", current_time);
        msg!(
            "start clock + end clokc = {}",
            pda.start_clock + pda.end_clock
        );
        if pda.start_clock + pda.end_clock > current_time {
            msg!("time lock not reached yet");
            return Err(CustomError::NotReached.into());
        }

        **pda.to_account_info().try_borrow_mut_lamports()? -= pda.nbr_lamports;
        **user.try_borrow_mut_lamports()? += pda.nbr_lamports;
        msg!(
            "transfered {} lamports fron {} to {}",
            pda.nbr_lamports,
            pda.key(),
            user.key
        );
        pda.close(user.to_account_info())?;
        msg!("pda closed");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        seeds = [b"time-vault", user.key().as_ref()],
        bump,
        payer = user,
        space = 256
    )]
    pub time_vault_pda: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unlock<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"time-vault", user.key().as_ref()],
        bump = time_vault_pda.bump,
    )]
    pub time_vault_pda: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}
