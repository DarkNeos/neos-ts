#![allow(non_snake_case)]

mod buffer;
mod utils;
mod adapters;

pub use utils::set_panic_hook;
pub use adapters::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
