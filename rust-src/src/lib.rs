#![allow(non_snake_case)]

mod adapters;
mod buffer;
mod utils;

pub use adapters::*;
pub use buffer::BufferReader;
pub use utils::set_panic_hook;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
